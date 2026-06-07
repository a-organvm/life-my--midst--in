import './types.d.ts';
import { getEnv } from './env';
import './tracing';
import { initializeTracing } from './tracing';

// Validate environment variables before anything else starts
getEnv();
import { initializeSentry, Sentry } from './sentry';
import { startMetricsServer } from './metrics-server';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyWebsocket from '@fastify/websocket';
import rawBody from 'fastify-raw-body';
import { Pool } from 'pg';
import { register, httpRequestsTotal, httpRequestDuration, activeConnections } from './metrics';
import { registerProfileRoutes } from './routes/profiles';
import { registerMaskRoutes } from './routes/masks';
import { registerCvRoutes } from './routes/cv';
import { registerCurriculumVitaeMultiplexRoutes } from './routes/curriculum-vitae-multiplex';
import { registerNarrativeRoutes } from './routes/narratives';
import { registerAetasRoutes } from './routes/aetas';
import { registerExportRoutes } from './routes/exports';
import { registerBackupRoutes } from './routes/backups';
import { registerAgentRoutes } from './routes/agent-interface';
import { registerAttestationBlockRoutes } from './routes/attestation-blocks';
import { jobRoutes } from './routes/jobs';
import { interviewRoutes } from './routes/interviews';
import { createInterviewSessionRepo } from './repositories/interview-sessions';
import { registerHunterProtocolRoutes } from './routes/hunter-protocol';
import { registerArtifactRoutes } from './routes/artifacts';
import { registerIntegrationRoutes } from './routes/integrations';
import { registerSearchRoutes } from './routes/search';
import { registerDidRoutes } from './routes/did';
import sbtRoutes from './routes/sbt';
import marketplaceRoutes from './routes/marketplace';
import academicRoutes from './routes/academic';
import { registerIdentityRoutes } from './routes/identity';
import { demoRoutes } from './routes/demo';
import { registerWebsocketRoutes } from './routes/websocket';
import { registerGraphQLRoute } from './routes/graphql';
import { InMemoryPubSub } from './services/pubsub';
import type { ProfileRepo } from './repositories/profiles';
import type { MaskRepo, EpochRepo, StageRepo } from './repositories/masks';
import { createMaskRepo } from './repositories/masks';
import { profileRepo } from './repositories/profiles';
import type { CvRepos } from './repositories/cv';
import { cvRepos } from './repositories/cv';
import { narrativeRepo } from './repositories/narratives';
import type { BackupRepo } from './repositories/backups';
import type { JobRepo } from './repositories/jobs';
import { jobRepo as defaultJobRepo } from './repositories/jobs';
import { registerBillingRoutes } from './routes/billing';
import { registerAdminLicensingRoutes } from './routes/admin-licensing';
import { registerAdminServiceStatusRoutes } from './routes/admin-service-status';
import { registerAdminSettingsRoutes } from './routes/admin-settings';
import { registerUserSettingsRoutes } from './routes/user-settings';
import {
  createSettingsRepo,
  InMemorySettingsRepo,
  type SettingsRepo,
} from './repositories/settings';
import {
  subscriptionRepo as defaultSubscriptionRepo,
  type SubscriptionRepo,
} from './repositories/subscriptions';
import {
  PostgresRateLimitStore,
  InMemoryRateLimitStore as LocalInMemoryRateLimitStore,
} from './repositories/rate-limits';
import {
  PostgresEmbeddingsRepo,
  InMemoryEmbeddingsRepo,
  type EmbeddingsRepo,
} from './repositories/embeddings';
import {
  BillingService,
  LicensingService,
  setRegistry,
  type RateLimitStore,
} from '@in-midst-my-life/core';
import { PostgresDIDRegistry } from './repositories/did-registry';
import { versionPrefix } from './middleware/versioning';
import scalarApiReference from '@scalar/fastify-api-reference';
import { JWTAuth } from './services/auth';
import { createAuthMiddleware, createOptionalAuthMiddleware } from './middleware/auth';
import { InMemoryTokenBlocklist, type TokenBlocklist } from './services/token-blocklist';

initializeTracing();
initializeSentry();
startMetricsServer();

export interface ApiServerOptions {
  profileRepo?: ProfileRepo;
  maskRepo?: MaskRepo;
  epochRepo?: EpochRepo;
  stageRepo?: StageRepo;
  cvRepos?: CvRepos;
  backupRepo?: BackupRepo;
  jobRepo?: JobRepo;
  subscriptionRepo?: SubscriptionRepo;
  rateLimitStore?: RateLimitStore;
  billingService?: BillingService;
  licensingService?: LicensingService;
  embeddingsRepo?: EmbeddingsRepo;
  settingsRepo?: SettingsRepo;
  /** When true, skip JWT auth hooks (tests provide their own mock auth) */
  disableAuth?: boolean;
}

export function buildServer(options: ApiServerOptions = {}) {
  const fastify = Fastify({
    logger: process.env['NODE_ENV'] === 'test' ? false : true,
  });
  const metrics = { requests: 0, errors: 0 };

  const maskRepoDefaults = createMaskRepo();
  const maskRepo = options.maskRepo ?? maskRepoDefaults.masks;
  const epochRepo = options.epochRepo ?? maskRepoDefaults.epochs;
  const stageRepo = options.stageRepo ?? maskRepoDefaults.stages;

  const subRepo = options.subscriptionRepo ?? defaultSubscriptionRepo;

  const defaultRateLimitStore =
    process.env['NODE_ENV'] === 'test'
      ? new LocalInMemoryRateLimitStore()
      : new PostgresRateLimitStore(
          new Pool({
            connectionString: process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'],
          }),
        );

  // Initialize persistent DID registry (replaces in-memory default)
  if (process.env['NODE_ENV'] !== 'test') {
    const didPool = new Pool({
      connectionString: process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'],
    });
    setRegistry(new PostgresDIDRegistry(didPool));
  }

  // Initialize embeddings repository for semantic search
  const embeddingsRepo: EmbeddingsRepo =
    options.embeddingsRepo ??
    (process.env['NODE_ENV'] === 'test'
      ? new InMemoryEmbeddingsRepo()
      : new PostgresEmbeddingsRepo(
          new Pool({
            connectionString: process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'],
          }),
        ));

  // Initialize settings repository
  const settingsRepo: SettingsRepo =
    options.settingsRepo ??
    (process.env['NODE_ENV'] === 'test'
      ? new InMemorySettingsRepo()
      : createSettingsRepo(
          new Pool({
            connectionString: process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'],
          }),
        ));

  // Initialize services if not provided
  const licensingService =
    options.licensingService ??
    new LicensingService(async (profileId) => {
      const sub = await subRepo.getByProfileId(profileId);
      return sub?.tier ?? 'FREE';
    }, options.rateLimitStore ?? defaultRateLimitStore);

  const billingService =
    options.billingService ??
    new BillingService({
      stripeSecretKey: process.env['STRIPE_SECRET_KEY'] || 'sk_test_mock',
      stripePriceIds: {
        FREE: { monthly: 'free', yearly: 'free' },
        PRO: {
          monthly: process.env['STRIPE_PRO_MONTHLY'] || 'price_pro_monthly',
          yearly: process.env['STRIPE_PRO_YEARLY'] || 'price_pro_yearly',
        },
        ENTERPRISE: {
          monthly: process.env['STRIPE_ENTERPRISE_MONTHLY'] || 'price_enterprise_custom',
          yearly: process.env['STRIPE_ENTERPRISE_YEARLY'] || 'price_enterprise_custom',
        },
      },
      webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] || 'whsec_test_mock',
    });

  // PubSub engine for GraphQL subscriptions
  const pubsub = new InMemoryPubSub();

  // JWT authentication — uses env var or a dev-only default for test/development
  const jwtSecret =
    process.env['JWT_SECRET'] || // allow-secret
    (process.env['NODE_ENV'] === 'production'
      ? undefined
      : 'dev-only-secret-do-not-use-in-prod-32chars!'); // allow-secret
  const jwtAuth = jwtSecret ? new JWTAuth({ secret: jwtSecret }) : undefined;

  // Token revocation blocklist (ADR-010) — InMemory for now; swap to RedisTokenBlocklist in production
  const tokenBlocklist: TokenBlocklist = new InMemoryTokenBlocklist();

  // Security headers (CSP, HSTS, X-Frame-Options, etc.)
  if (process.env['NODE_ENV'] !== 'test') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- Fastify plugin type mismatch
    fastify.register(helmet as any, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'wss:', 'https:'],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- Fastify plugin type mismatch
  fastify.register(rawBody as any, {
    global: false, // Only for specific routes
    runFirst: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- Fastify plugin type mismatch
  fastify.register(fastifyWebsocket as any, {
    options: { maxPayload: 1048576 } // 1MB limit
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- Fastify plugin type mismatch
  fastify.register(cors as any, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // Development: allow localhost
      const allowed = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'https://yourdomain.com',
        'https://app.yourdomain.com',
      ];

      const allowedOrigins = process.env['ALLOWED_ORIGINS']
        ? process.env['ALLOWED_ORIGINS'].split(',')
        : allowed;

      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept-Version'],
    exposedHeaders: [
      'X-Total-Count',
      'X-Page-Count',
      'X-API-Version',
      'Deprecation',
      'Sunset',
      'Link',
    ],
    maxAge: 86400, // 24 hours
  });

  // Interactive API documentation UI at /api/docs
  if (process.env['NODE_ENV'] !== 'test') {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any -- Fastify plugin type mismatch
    fastify.register(scalarApiReference as any, {
      routePrefix: '/api/docs',
      configuration: {
        theme: 'kepler',
        spec: {
          url: '/api/docs/openapi.yaml',
        },
      },
    });

    // Serve the OpenAPI spec file
    fastify.get('/api/docs/openapi.yaml', async (_request, reply) => {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');
      const specPath = path.join(__dirname, '..', 'openapi.yaml');
      const content = await fs.readFile(specPath, 'utf8');
      return reply.type('text/yaml').send(content);
    });
  }

  const requestStartTimes = new WeakMap<object, number>();

  fastify.addHook('onRequest', (request, _reply, done) => {
    metrics.requests += 1;
    requestStartTimes.set(request, Date.now());
    activeConnections.inc({ type: 'http' });
    done();
  });

  fastify.addHook('onResponse', (request, reply, done) => {
    const duration = (Date.now() - (requestStartTimes.get(request) ?? Date.now())) / 1000;
    const route = request.routeOptions?.url || request.url;
    const statusCode = reply.statusCode.toString();

    httpRequestsTotal.inc({
      method: request.method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      { method: request.method, route, status_code: statusCode },
      duration,
    );

    activeConnections.dec({ type: 'http' });
    done();
  });

  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error({ err: error, url: request.url }, 'request_error');
    metrics.errors += 1;

    if (process.env['SENTRY_DSN']) {
      Sentry.captureException(error, {
        contexts: {
          request: {
            method: request.method,
            url: request.url,
            headers: request.headers,
          },
        },
      });
    }

    const fastifyError = error as Error & { statusCode?: number; code?: string };
    const status = fastifyError.statusCode ?? 500;
    return reply.status(status).send({
      ok: false,
      error: fastifyError.code ?? 'internal_error',
      message: fastifyError.message,
    });
  });

  // Note: Versioning middleware is registered per-scope in registerApiRoutes
  // System endpoints (/health, /ready, /metrics) intentionally don't have version headers

  fastify.get('/health', () => ({ status: 'ok' }));

  fastify.get('/ready', async (request, reply) => {
    try {
      await (options.profileRepo ?? profileRepo).list(0, 1);
      return { status: 'ready' };
    } catch (err) {
      request.log.error({ err }, 'readiness_failed');
      return reply.code(503).send({ status: 'degraded' });
    }
  });

  // Public runtime config — exposes non-sensitive info for frontend mock-mode indicators
  fastify.get('/config', async (_request, reply) => {
    const env = process.env['NODE_ENV'] || 'development';
    const stripeKey = process.env['STRIPE_SECRET_KEY'] || '';
    const openaiKey = process.env['OPENAI_API_KEY'] || '';
    const mockServices: string[] = [];
    if (!stripeKey || stripeKey === 'sk_test_mock') mockServices.push('stripe');
    if (!openaiKey || openaiKey === 'sk-test-mock' || openaiKey.includes('test'))
      mockServices.push('openai');
    if (!process.env['SENTRY_DSN']) mockServices.push('sentry');

    return reply.send({
      environment: env,
      mockMode: env !== 'production' || mockServices.length > 0,
      mockServices,
      features: {
        hunterProtocol: true,
        invertedInterviews: true,
        didVerification: true,
        autonomousAgents: false,
      },
    });
  });

  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    const legacyMetrics = [
      '# HELP api_requests_total Total API requests processed (legacy).',
      '# TYPE api_requests_total counter',
      `api_requests_total ${metrics.requests}`,
      '# HELP api_errors_total Total API requests resulting in error (legacy).',
      '# TYPE api_errors_total counter',
      `api_errors_total ${metrics.errors}`,
    ].join('\n');
    return (await register.metrics()) + '\n' + legacyMetrics;
  });

  /**
   * Register all API routes under a given scope.
   * This helper allows registering routes at both /v1/ (canonical) and root (deprecated).
   *
   * @param scope Fastify instance (scoped or root)
   * @param isDeprecated Whether this scope is deprecated (adds deprecation headers)
   */
  const registerApiRoutes = (scope: FastifyInstance, isDeprecated: boolean) => {
    // Add X-API-Version header to all responses in this scope
    // Using preHandler ensures headers are set before any response processing
    scope.addHook('preHandler', (_request, reply, done) => {
      reply.header('X-API-Version', '1');
      done();
    });

    // ── Auth middleware (secure by default) ────────────────────────────
    //
    // Strategy:
    //   1. Public routes: No auth required (webhooks, agent interface,
    //      GraphQL schema introspection in dev)
    //   2. Optional auth routes: GET requests on public-read prefixes
    //      enrich request.user if a token is present, but don't block
    //   3. Everything else: Requires a valid JWT Bearer token
    //
    // Note: /health, /ready, /metrics are registered outside this scope
    // and are always public.

    // Exact routes that skip auth entirely (use their own verification)
    const publicRoutes = new Set(['/billing/webhooks/stripe', '/agent/v1/query']);

    // Prefix-based routes that skip auth (matched with startsWith)
    const publicPrefixes = [
      '/graphql', // GraphQL endpoint (has its own introspection guards)
      '/demo', // Demo mode for unauthenticated visitors
      '/share', // Public share pages
    ];

    // Prefix-based routes that use optional auth on GET requests
    // (enrich request.user if present, don't block anonymous access)
    const optionalAuthPrefixes = [
      '/profiles',
      '/taxonomy/masks',
      '/taxonomy/epochs',
      '/taxonomy/stages',
      '/marketplace',
    ];

    if (jwtAuth && !options.disableAuth) {
      const authMiddleware = createAuthMiddleware(jwtAuth, tokenBlocklist);
      const optionalAuth = createOptionalAuthMiddleware(jwtAuth);

      scope.addHook('onRequest', async (request, reply) => {
        // Skip if user is already authenticated (e.g. by test mock hook)
        if (request.user) return;

        // Strip version prefix so auth rules match regardless of /v1/ or root scope
        const url = (request.url.split('?')[0] ?? '').replace(/^\/v\d+/, '');

        // 1. Exact public route match
        if (publicRoutes.has(url)) return;

        // 2. Prefix-based public route match
        if (publicPrefixes.some((p) => url === p || url.startsWith(p + '/'))) return;

        // 3. Optional auth for GET on public-read prefixes
        const isOptional =
          request.method === 'GET' &&
          optionalAuthPrefixes.some((prefix) => url === prefix || url.startsWith(prefix + '/'));

        if (isOptional) {
          await optionalAuth(request, reply);
        } else {
          await authMiddleware(request, reply);
        }
      });
    }

    // Add deprecation headers for deprecated scope (root routes)
    if (isDeprecated) {
      const deprecationDate = new Date();
      deprecationDate.setDate(deprecationDate.getDate() + 90); // 90-day deprecation window

      scope.addHook('preHandler', (_request, reply, done) => {
        reply.header('Deprecation', 'true');
        reply.header('Sunset', deprecationDate.toUTCString());
        reply.header('Link', `</v1${_request.url}>; rel="successor-version"`);
        done();
      });
    }

    scope.register(registerProfileRoutes, {
      prefix: '/profiles',
      repo: options.profileRepo,
      maskRepo,
      epochRepo,
      stageRepo,
    });
    scope.register(registerCvRoutes, { prefix: '/profiles', repos: options.cvRepos ?? cvRepos });
    scope.register(registerCurriculumVitaeMultiplexRoutes, { prefix: '/profiles' });
    scope.register(registerNarrativeRoutes, {
      prefix: '/profiles',
      maskRepo,
      cvRepos: options.cvRepos ?? cvRepos,
      narrativeRepo,
    });
    scope.register(registerAetasRoutes, { prefix: '/profiles' });
    scope.register(registerExportRoutes, {
      prefix: '/profiles',
      profileRepo: options.profileRepo ?? profileRepo,
      cvRepos: options.cvRepos ?? cvRepos,
      backupRepo: options.backupRepo,
      maskRepo,
      epochRepo,
      stageRepo,
    });
    scope.register(registerBackupRoutes, {
      prefix: '/profiles',
      profileRepo: options.profileRepo ?? profileRepo,
      cvRepos: options.cvRepos ?? cvRepos,
      backupRepo: options.backupRepo,
    });
    scope.register(registerAgentRoutes, { prefix: '/agent' });
    scope.register(registerMaskRoutes, {
      prefix: '/taxonomy',
      masks: maskRepo,
      epochs: epochRepo,
      stages: stageRepo,
    });
    scope.register(registerAttestationBlockRoutes);
    scope.register(jobRoutes);
    const interviewSessionRepo =
      process.env['NODE_ENV'] === 'test'
        ? createInterviewSessionRepo()
        : createInterviewSessionRepo(
            new Pool({
              connectionString: process.env['DATABASE_URL'] ?? process.env['POSTGRES_URL'],
            }),
          );
    scope.decorate('interviewSessionRepo', interviewSessionRepo);
    scope.decorate('pubsub', pubsub);
    scope.decorate('settingsRepo', settingsRepo);
    scope.decorate('profileRepo', options.profileRepo ?? profileRepo);
    scope.register(interviewRoutes);
    scope.register(registerHunterProtocolRoutes, {
      prefix: '/profiles',
      repo: options.profileRepo ?? profileRepo,
      jobRepo: options.jobRepo ?? defaultJobRepo,
      licensingService,
    });
    scope.register(registerBillingRoutes, {
      prefix: '/billing',
      billingService,
      subscriptionRepo: subRepo,
      licensingService,
    });
    scope.register(registerAdminLicensingRoutes, licensingService);
    scope.register(registerAdminServiceStatusRoutes);
    scope.register(registerAdminSettingsRoutes, { settingsRepo });
    scope.register(registerUserSettingsRoutes, { settingsRepo });
    scope.register(registerArtifactRoutes);
    scope.register(sbtRoutes);
    scope.register(marketplaceRoutes);
    scope.register(academicRoutes);
    scope.register(registerIntegrationRoutes);
    scope.register(registerSearchRoutes, {
      prefix: '/search',
      embeddingsRepo,
      embeddingsConfig: {
        apiKey: process.env['OPENAI_API_KEY'] || 'sk-test-mock',
      },
    });
    scope.register(registerDidRoutes, { prefix: '/did' });
    scope.register(registerIdentityRoutes, { prefix: '/profiles' });
    scope.register(demoRoutes);
    scope.register(registerGraphQLRoute, {
      profileRepo: options.profileRepo ?? profileRepo,
      maskRepo,
      epochRepo,
      stageRepo,
      cvRepos,
      narrativeRepo,
      pubsub,
      jwtAuth,
      disableAuth: options.disableAuth,
    });

    scope.register(registerWebsocketRoutes);

    // Token revocation endpoint (ADR-010)
    if (jwtAuth) {
      scope.post('/auth/revoke', async (request, reply) => {
        if (!request.user) {
          return reply.code(401).send({
            ok: false,
            error: 'unauthorized',
            message: 'Authentication required',
          });
        }

        // Extract the token being used (to get its jti and exp)
        const authHeader = request.headers.authorization;
        const token = JWTAuth.extractToken(authHeader);
        if (!token) {
          return reply.code(400).send({
            ok: false,
            error: 'bad_request',
            message: 'No token to revoke',
          });
        }

        const decoded = jwtAuth.decodeToken(token);
        if (!decoded?.jti || !decoded.exp) {
          return reply.code(400).send({
            ok: false,
            error: 'bad_request',
            message: 'Token does not contain a revocable identifier',
          });
        }

        await tokenBlocklist.add(decoded.jti, decoded.exp);
        return reply.code(200).send({ ok: true, message: 'Token revoked' });
      });
    }
  };

  // Register v1 API routes (canonical)
  fastify.register(
    (v1Scope, _opts, done) => {
      registerApiRoutes(v1Scope, false);
      done();
    },
    { prefix: versionPrefix(1) },
  );

  // Register root API routes (deprecated - 90-day sunset)
  // These are backward-compatible aliases that will be removed after v1 adoption
  fastify.register((rootScope, _opts, done) => {
    registerApiRoutes(rootScope, true);
    done();
  });

  return fastify;
}

export async function start() {
  const fastify = buildServer();
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

if (process.env['NODE_ENV'] !== 'test') {
  void start();
}

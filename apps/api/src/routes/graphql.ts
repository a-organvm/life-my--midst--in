import type { FastifyInstance } from 'fastify';
import {
  buildSchema,
  graphql,
  execute as graphqlExecute,
  subscribe as graphqlSubscribe,
  validate as graphqlValidate,
  parse as graphqlParse,
  type GraphQLSchema,
} from 'graphql';
import { graphqlSchema } from '../services/graphql-schema';
import {
  queryResolvers,
  mutationResolvers,
  subscriptionResolvers,
  type GraphQLContext,
} from '../services/graphql-resolvers';
import type { ProfileRepo } from '../repositories/profiles';
import type { MaskRepo, EpochRepo, StageRepo } from '../repositories/masks';
import type { CvRepos } from '../repositories/cv';
import type { NarrativeRepo } from '../repositories/narratives';
import type { PubSubEngine } from '../services/pubsub';
import { JWTAuth } from '../services/auth';

/**
 * GraphQL route handler
 * Provides a unified GraphQL API gateway for querying profiles, masks, narratives, etc.
 * Supports HTTP POST/GET for queries and mutations, plus WebSocket for subscriptions.
 */

interface GraphQLPluginDeps {
  profileRepo?: ProfileRepo;
  maskRepo?: MaskRepo;
  epochRepo?: EpochRepo;
  stageRepo?: StageRepo;
  cvRepos?: CvRepos;
  narrativeRepo?: NarrativeRepo;
  pubsub?: PubSubEngine;
  jwtAuth?: JWTAuth;
  disableAuth?: boolean;
}

/** Maximum allowed query depth to prevent abuse */
const MAX_QUERY_DEPTH = 10;

/** Rough check for query depth by counting nested braces */
function estimateQueryDepth(query: string): number {
  let depth = 0;
  let maxDepth = 0;
  for (const ch of query) {
    if (ch === '{') {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (ch === '}') {
      depth--;
    }
  }
  return maxDepth;
}

function buildContext(deps: GraphQLPluginDeps): GraphQLContext {
  return {
    profileRepo: deps.profileRepo,
    maskRepo: deps.maskRepo,
    epochRepo: deps.epochRepo,
    stageRepo: deps.stageRepo,
    cvRepos: deps.cvRepos,
    narrativeRepo: deps.narrativeRepo,
    pubsub: deps.pubsub,
  };
}

export async function registerGraphQLRoute(
  fastify: FastifyInstance,
  deps: GraphQLPluginDeps,
): Promise<void> {
  // Build GraphQL schema once at startup
  let schema: GraphQLSchema;
  try {
    schema = buildSchema(graphqlSchema);
  } catch (error) {
    fastify.log.error(error, 'Failed to build GraphQL schema');
    throw error instanceof Error ? error : new Error(String(error));
  }

  // Merge query + mutation + subscription resolvers into root value
  const rootValue = {
    ...queryResolvers,
    ...mutationResolvers,
    ...subscriptionResolvers,
  };

  const isProduction = process.env['NODE_ENV'] === 'production';

  // ──── WebSocket transport for subscriptions ─────────────────────────
  // @fastify/websocket is already registered globally in index.ts

  // graphql-ws server handles the subscription protocol over WebSocket.
  // We use require() for CJS resolution and supply onSubscribe to perform
  // our own parse/validate using our app's graphql import. This avoids the
  // "Cannot use GraphQLSchema from another module or realm" error that
  // occurs when graphql-ws's bundled require('graphql') resolves to a
  // different module instance (ESM vs CJS) in test/bundler environments.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- CJS needed to avoid dual graphql instance
  const { makeServer } = require('graphql-ws') as typeof import('graphql-ws');
  const wsServer = makeServer({
    schema,
    // Require valid JWT on WebSocket connection init
    onConnect: async (ctx) => {
      if (!deps.jwtAuth || deps.disableAuth) return true; // Auth not configured or disabled
      const params = ctx.connectionParams as Record<string, unknown> | undefined;
      const authHeader =
        typeof params?.['authorization'] === 'string' ? params['authorization'] : undefined;
      if (!authHeader) return false;
      const token = JWTAuth.extractToken(authHeader);
      if (!token) return false;
      const claims = await deps.jwtAuth.verifyToken(token);
      if (!claims) return false;
      return true;
    },
    context: () => buildContext(deps),
    onSubscribe: (_ctx, _id, payload) => {
      const document = graphqlParse(payload.query ?? '');
      const errors = graphqlValidate(schema, document);
      if (errors.length > 0) return errors;
      return {
        schema,
        document,
        rootValue,
        contextValue: buildContext(deps),
        variableValues: payload.variables as Record<string, unknown> | undefined,
        operationName: payload.operationName ?? undefined,
      };
    },
    execute: (args) => graphqlExecute(args),
    subscribe: (args) => graphqlSubscribe(args),
  });

  /**
   * GET /graphql/ws — WebSocket endpoint for GraphQL subscriptions
   *
   * Bridges Fastify's @fastify/websocket to graphql-ws protocol handler.
   */
  fastify.get('/graphql/ws', { websocket: true }, (socket) => {
    // opened() returns a cleanup function: (code?, reason?) => Promise<void>
    const closed = wsServer.opened(
      {
        protocol: socket.protocol,
        send: (data: string) =>
          new Promise<void>((resolve, reject) => {
            socket.send(data, (err?: Error) => {
              if (err) reject(err);
              else resolve();
            });
          }),
        close: (code?: number, reason?: string) => {
          socket.close(code, reason);
        },
        onMessage: (cb: (message: string) => Promise<void>) => {
          socket.on('message', (data: Buffer) => {
            void cb(data.toString());
          });
        },
        onPing: () => {
          socket.ping();
        },
        onPong: () => {
          /* pong received — no action needed */
        },
      },
      { socket },
    );

    socket.on('close', (code: number, reason: Buffer) => {
      void closed(code, reason.toString());
    });
  });

  // ──── HTTP endpoints ────────────────────────────────────────────────

  /**
   * POST /graphql
   *
   * Accepts GraphQL queries and mutations in the request body.
   */
  fastify.post<{
    Body: { query: string; variables?: Record<string, unknown>; operationName?: string };
  }>(
    '/graphql',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            variables: { type: 'object' },
            operationName: { type: 'string' },
          },
          required: ['query'],
        },
      },
    },
    async (request, reply) => {
      const { query, variables, operationName } = request.body;

      if (!query) {
        return reply.code(400).send({
          errors: [{ message: 'No query provided' }],
        });
      }

      // Block introspection in production
      if (isProduction && query.includes('__schema')) {
        return reply.code(400).send({
          errors: [{ message: 'Introspection is disabled in production' }],
        });
      }

      // Depth limiting
      if (estimateQueryDepth(query) > MAX_QUERY_DEPTH) {
        return reply.code(400).send({
          errors: [{ message: `Query depth exceeds maximum of ${MAX_QUERY_DEPTH}` }],
        });
      }

      try {
        const context = buildContext(deps);

        const result = await graphql({
          schema,
          source: query,
          rootValue,
          contextValue: context,
          variableValues: variables,
          operationName,
        });

        return {
          data: result.data,
          errors: result.errors?.map((e) => ({
            message: e.message,
            locations: e.locations,
            path: e.path,
          })),
        };
      } catch (error) {
        fastify.log.error(error, 'GraphQL query error');

        return reply.code(500).send({
          errors: [
            {
              message: error instanceof Error ? error.message : 'Internal server error',
            },
          ],
        });
      }
    },
  );

  /**
   * GET /graphql/schema
   *
   * Returns the GraphQL schema in SDL format. Disabled in production.
   */
  fastify.get('/graphql/schema', async (_request, reply) => {
    if (isProduction) {
      return reply.code(403).send({ error: 'Schema introspection disabled in production' });
    }
    return reply.type('text/plain').send(graphqlSchema);
  });

  /**
   * GET /graphql
   *
   * Handles GraphQL requests via query parameter for simple queries.
   * Primarily for debugging and introspection — disabled in production.
   */
  fastify.get<{
    Querystring: { query?: string };
  }>('/graphql', async (request, reply) => {
    if (isProduction) {
      return reply.code(405).send({ error: 'GET queries disabled in production' });
    }

    const { query } = request.query;

    if (!query) {
      return reply.code(400).send({
        errors: [{ message: 'No query parameter provided' }],
      });
    }

    try {
      const context = buildContext(deps);

      const result = await graphql({
        schema,
        source: query,
        rootValue,
        contextValue: context,
      });

      return {
        data: result.data,
        errors: result.errors,
      };
    } catch (error) {
      return reply.code(500).send({
        errors: [
          {
            message: error instanceof Error ? error.message : 'Internal server error',
          },
        ],
      });
    }
  });
}

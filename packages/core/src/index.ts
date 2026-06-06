export { matchMasksToContext, rankMasksByPriority } from './maskMatching';
export * from './masks';
export * from './crypto';
export * from './vc';
export * from './did/registry';
export * from './did/resolver-registry';
export * from './did/resolvers/web';
export * from './did/resolvers/key';
export * from './did/resolvers/jwk';
export * from './did/resolvers/pkh';
export * from './errors';
export * from './jobs';
export * from './search';
export * from './hunter';
export * from './academic';

// Re-export types from server module for TypeScript consumers
// (Types don't carry runtime dependencies, so safe to export from main entry)
export type {
  ExtractedFileMetadata,
  CloudStorageProvider,
  CloudFile,
  CloudCredentials,
  ListOptions,
  ProviderHealthStatus,
} from './integrations/cloud-storage-provider';
export {
  HunterAgent as HunterProtocolAgent,
  createHunterProtocolAgent,
  MockJobSearchProvider as HunterMockJobSearchProvider,
  createJobSearchProvider,
  DefaultCompatibilityAnalyzer,
} from './hunter-protocol';
export { DocumentGenerator } from './hunter-protocol';
export * from './licensing/licensing-service';
export * from './billing/billing-service';
export * from './analytics/events';
export * from './analytics/analytics-service';
export { EmbeddingsService, type EmbeddingsConfig } from './embeddings/service';
export * from './evm';

// Server-only exports (cloud storage integrations with ssh2, smb2, etc.)
// are available from '@in-midst-my-life/core/server' to prevent webpack bundling issues
// See packages/core/src/server.ts

// Services index file - exports all service modules

export { DabApiClient, DabApiError, getDabApiClient } from './DabApiClient';
export type { DabApiClientConfig } from './DabApiClient';

// Re-export the default client getter
export { default as dabApiClient } from './DabApiClient';
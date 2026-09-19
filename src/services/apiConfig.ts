/**
 * Centralized API and environment configuration.
 * Prepares the frontend for seamless FastAPI backend connection.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : ({} as Record<string, string | undefined>);

export const API_CONFIG = {
  baseUrl: env.VITE_API_BASE_URL || 'http://localhost:8000',
  apiPrefix: '/api/v1',
  eventName: env.VITE_EVENT_NAME || 'EVENT HQ · BMSIT 2026',
  isMockEnabled: env.VITE_ENABLE_MOCK_DATA !== 'false', // Default to true in development
  timeoutMs: 10000,
};

export function getEndpointUrl(path: string): string {
  const cleanBase = API_CONFIG.baseUrl.replace(/\/+$/, '');
  const cleanPrefix = API_CONFIG.apiPrefix.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPrefix}${cleanPath}`;
}

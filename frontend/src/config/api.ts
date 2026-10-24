/**
 * Centralized API configuration for TrustVault.
 * Resolves the backend base URL dynamically:
 * - In production: points to VITE_API_BASE_URL (Render URL).
 * - In local development: defaults to empty string (proxied by Vite to localhost:8000).
 */

export const API_BASE_URL: string = (
  import.meta.env.VITE_API_BASE_URL || ''
).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Transmit session cookies cross-domain
  });
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { API_BASE_URL } from './config/api'

// Route all /api requests to production backend when VITE_API_BASE_URL is configured
if (API_BASE_URL) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const isRelativeApi = url.startsWith('/api');
    const isAbsoluteApi = url.startsWith(API_BASE_URL);
    if (isRelativeApi || isAbsoluteApi) {
      const targetUrl = isRelativeApi ? `${API_BASE_URL}${url}` : url;
      const sessionId = sessionStorage.getItem('trustvault_session_id');
      const headers = new Headers(init?.headers || {});
      if (sessionId && !headers.has('X-Session-ID')) {
        headers.set('X-Session-ID', sessionId);
      }
      return originalFetch(targetUrl, {
        ...init,
        headers,
        credentials: init?.credentials || 'include',
      });
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

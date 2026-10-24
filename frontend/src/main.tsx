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
    if (url.startsWith('/api')) {
      const targetUrl = `${API_BASE_URL}${url}`;
      return originalFetch(targetUrl, {
        ...init,
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

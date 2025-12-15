import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global fetch interceptor to fix double /api/ prefix issue
// This works even with old cached bundles
// MUST run before any other code to catch all fetch calls
(function() {
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let url: string;
        let fixedInput: RequestInfo | URL = input;
        
        if (typeof input === 'string') {
            url = input;
        } else if (input instanceof URL) {
            url = input.toString();
        } else if (input instanceof Request) {
            url = input.url;
        } else {
            url = String(input);
        }
        
        // Fix double /api/ prefix for api.menupi.com
        if (url && url.includes('api.menupi.com') && url.includes('/api/')) {
            const fixedUrl = url.replace(/(https?:\/\/api\.menupi\.com)\/api\//, '$1/');
            if (fixedUrl !== url) {
                console.warn('[Fetch Interceptor] Fixed URL:', url, '→', fixedUrl);
                if (typeof input === 'string') {
                    fixedInput = fixedUrl;
                } else if (input instanceof URL) {
                    fixedInput = new URL(fixedUrl);
                } else if (input instanceof Request) {
                    fixedInput = new Request(fixedUrl, {
                        method: input.method,
                        headers: input.headers,
                        body: input.body,
                        mode: input.mode,
                        credentials: input.credentials,
                        cache: input.cache,
                        redirect: input.redirect,
                        referrer: input.referrer,
                        integrity: input.integrity
                    });
                }
            }
        }
        
        return originalFetch.call(this, fixedInput, init);
    };
})();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
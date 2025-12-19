import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global fetch interceptor to fix double /api/ prefix issue
// This works even with old cached bundles
// MUST run before any other code to catch all fetch calls
(function() {
    const originalFetch = window.fetch;
    
    // More aggressive URL fixer - handles all cases
    const fixApiUrl = (url: string): string => {
        if (!url || typeof url !== 'string') return url;
        
        // Fix: https://api.menupi.com/api/anything -> https://api.menupi.com/anything
        // This pattern catches all double /api/ prefixes
        if (url.includes('api.menupi.com')) {
            // Remove /api/ if it appears after api.menupi.com
            const fixed = url.replace(/(https?:\/\/api\.menupi\.com)\/api\//g, '$1/');
            if (fixed !== url) {
                console.warn('[Fetch Interceptor] Fixed URL:', url, '→', fixed);
                return fixed;
            }
        }
        return url;
    };
    
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let url: string = '';
        let fixedInput: RequestInfo | URL = input;
        
        // Extract URL from different input types
        if (typeof input === 'string') {
            url = input;
            const fixed = fixApiUrl(url);
            if (fixed !== url) {
                fixedInput = fixed;
            }
        } else if (input instanceof URL) {
            url = input.toString();
            const fixed = fixApiUrl(url);
            if (fixed !== url) {
                fixedInput = new URL(fixed);
            }
        } else if (input instanceof Request) {
            url = input.url;
            const fixed = fixApiUrl(url);
            if (fixed !== url) {
                // Create new Request with fixed URL
                fixedInput = new Request(fixed, {
                    method: input.method,
                    headers: input.headers,
                    body: input.body,
                    mode: input.mode,
                    credentials: input.credentials,
                    cache: input.cache,
                    redirect: input.redirect,
                    referrer: input.referrer,
                    referrerPolicy: input.referrerPolicy,
                    integrity: input.integrity,
                    keepalive: input.keepalive,
                    signal: input.signal
                });
            }
        } else {
            url = String(input);
            const fixed = fixApiUrl(url);
            if (fixed !== url) {
                fixedInput = fixed;
            }
        }
        
        return originalFetch.call(this, fixedInput, init);
    };
    
    // Also intercept sendBeacon (used for ping endpoints)
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url: string | URL, data?: BodyInit | null): boolean {
        const urlStr = typeof url === 'string' ? url : url.toString();
        const fixed = fixApiUrl(urlStr);
        const fixedUrl = fixed !== urlStr ? (typeof url === 'string' ? fixed : new URL(fixed)) : url;
        return originalSendBeacon.call(this, fixedUrl, data);
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
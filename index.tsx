import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global fetch interceptor to fix double /api/ prefix issue
// This works even with old cached bundles
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string;
    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof URL) {
        url = input.toString();
    } else {
        url = input.url;
    }
    
    // Fix double /api/ prefix for api.menupi.com
    if (url.includes('api.menupi.com') && url.includes('/api/')) {
        const fixedUrl = url.replace(/(https?:\/\/api\.menupi\.com)\/api\//, '$1/');
        if (fixedUrl !== url) {
            console.warn('[Fetch Interceptor] Fixed URL:', url, '→', fixedUrl);
            if (typeof input === 'string') {
                input = fixedUrl;
            } else if (input instanceof URL) {
                input = new URL(fixedUrl);
            } else {
                input = new Request(fixedUrl, input);
            }
        }
    }
    
    return originalFetch.call(this, input, init);
};

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
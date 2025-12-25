import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Warm up ngrok connection to bypass browser warning page
const warmUpNgrokConnection = async () => {
  try {
    const apiBase = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || '';
    if (apiBase && (apiBase.includes('ngrok.io') || apiBase.includes('ngrok-free.app') || apiBase.includes('ngrok.app'))) {
      // Make a HEAD request to warm up the connection
      // This helps bypass ngrok's browser warning page
      await fetch(`${apiBase}/api/health`, {
        method: 'HEAD',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        },
        cache: 'no-store'
      }).catch(() => {
        // Silently fail - this is just a warm-up
      });
    }
  } catch {
    // Ignore errors - non-critical
  }
};

// Warm up connection before app loads
warmUpNgrokConnection();

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
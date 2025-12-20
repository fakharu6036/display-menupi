/**
 * Normalizes media URLs to fix old localhost URLs in the database
 * This ensures all media URLs point to the correct production API endpoint
 */
export const normalizeMediaUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  
  // If it's already a full URL, check if it needs to be rewritten
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Rewrite localhost URLs to use the correct production API URL
    // Also handle http://localhost (without port) and http://127.0.0.1
    // Check for all variations: localhost:3000, localhost:3001, localhost (no port), 127.0.0.1
    if (url.includes('localhost:3000') || url.includes('localhost:3001') || 
        url.includes('127.0.0.1') || url.includes('localhost') || 
        url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        
        // Get the API base URL from environment or construct it
        const apiBaseUrl = import.meta.env.VITE_API_URL 
          ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') // Remove /api suffix
          : window.location.hostname === 'app.menupi.com' || window.location.hostname === 'tv.menupi.com'
          ? 'https://api.menupi.com'
          : `http://localhost:3001`;
        
        // Ensure protocol
        const baseUrl = apiBaseUrl.startsWith('http') 
          ? apiBaseUrl 
          : `https://${apiBaseUrl}`;
        
        // Construct new URL
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
      } catch (e) {
        // If URL parsing fails, try to extract path manually
        const pathMatch = url.match(/\/(uploads\/.+)$/);
        if (pathMatch) {
          const apiBaseUrl = import.meta.env.VITE_API_URL 
            ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
            : window.location.hostname === 'app.menupi.com' || window.location.hostname === 'tv.menupi.com'
            ? 'https://api.menupi.com'
            : `http://localhost:3001`;
          
          const baseUrl = apiBaseUrl.startsWith('http') 
            ? apiBaseUrl 
            : `https://${apiBaseUrl}`;
          
          return `${baseUrl}/${pathMatch[1]}`;
        }
        // If we can't parse it, return as-is
        return url;
      }
    }
    // If it's already a proper production URL, return as-is
    return url;
  }
  
  // If it's just a path, construct the full URL
  const apiBaseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
    : window.location.hostname === 'app.menupi.com' || window.location.hostname === 'tv.menupi.com'
    ? 'https://api.menupi.com'
    : `http://localhost:3001`;
  
  const baseUrl = apiBaseUrl.startsWith('http') 
    ? apiBaseUrl 
    : `https://${apiBaseUrl}`;
  
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};


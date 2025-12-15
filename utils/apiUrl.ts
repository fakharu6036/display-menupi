// Centralized API URL utility
// This ensures all API URLs are constructed correctly and fixes double /api/ prefix

const getApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (!envUrl) {
        return 'http://localhost:3001/api'; // Local development
    }
    // If production URL already ends with /api, remove it (legacy config)
    // Otherwise use as-is (correct config: https://api.menupi.com)
    return envUrl.replace(/\/api\/?$/, '');
};

const API_URL = getApiUrl();

// Runtime URL sanitizer - fixes double /api/ prefix
const sanitizeApiUrl = (url: string): string => {
    if (url.includes('api.menupi.com')) {
        // Remove /api/ if it appears after the domain
        url = url.replace(/(https?:\/\/api\.menupi\.com)\/api\//, '$1/');
        // Also catch double /api/api/
        url = url.replace(/\/api\/api\//g, '/api/');
    }
    return url;
};

/**
 * Constructs a correct API URL, automatically fixing double /api/ prefix
 * @param path - API path (e.g., '/screens', '/media', '/login')
 * @returns Full API URL with correct format
 */
export const apiUrl = (path: string): string => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    let fullUrl = `${API_URL}${cleanPath}`;
    // Always sanitize to fix any double /api/ issues
    fullUrl = sanitizeApiUrl(fullUrl);
    return fullUrl;
};

/**
 * Get the base API URL (for cases where you need to construct URLs manually)
 * @returns Base API URL without trailing slash
 */
export const getApiBaseUrl = (): string => {
    return API_URL;
};

// Export for backward compatibility
export { API_URL };


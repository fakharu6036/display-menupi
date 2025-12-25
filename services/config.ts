/**
 * Environment Configuration Utility
 * Handles API URLs and domain detection for production subdomains
 */

/**
 * Check if we're running in TV player context (tv.menupi.com)
 */
export const isTvPlayerContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('tv.menupi.com') || hostname === 'tv.menupi.com';
};

/**
 * Check if we're running in admin portal context (portal.menupi.com)
 */
export const isAdminPortalContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.includes('portal.menupi.com') || hostname === 'portal.menupi.com';
};

/**
 * Check if we're running in dashboard context (app.menupi.com)
 */
export const isDashboardContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // Not TV, not Portal, and is menupi.com = Dashboard
  return hostname.includes('menupi.com') && !isTvPlayerContext() && !isAdminPortalContext();
};

/**
 * Get the correct path for TV player navigation
 * On TV player context: returns root-level path (e.g., "/ABC123")
 * On dashboard context: returns /tv prefix path (e.g., "/tv/ABC123")
 */
export const getTvPlayerPath = (screenCode?: string): string => {
  if (isTvPlayerContext()) {
    // On TV player domain: root-level paths
    return screenCode ? `/${screenCode}` : '/';
  }
  // On dashboard domain: /tv prefix paths
  return screenCode ? `/tv/${screenCode}` : '/tv';
};

/**
 * Get the API base URL based on environment
 * Priority:
 * 1. VITE_API_BASE_URL (explicit, for local backend or custom setup)
 * 2. Production subdomain detection (api.menupi.com)
 * 3. Fallback to production URL
 */
export const getApiBase = (): string => {
  // Priority 1: Check for explicit environment variable (for local backend)
  const envApi = import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL;
  if (envApi) {
    return envApi.endsWith('/') ? envApi.slice(0, -1) : envApi;
  }

  // Priority 2: Production: Detect if we're on a menupi.com subdomain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production subdomains - API is on api.menupi.com
    if (hostname.includes('menupi.com')) {
      const protocol = window.location.protocol;
      const domain = hostname.split('.').slice(-2).join('.'); // Get menupi.com
      return `${protocol}//api.${domain}`;
    }
  }

  // Fallback: Use production API URL
  return 'https://api.menupi.com';
};

/**
 * Get the TV player domain for public player links
 * Production: tv.menupi.com/[code] (no /tv prefix)
 */
export const getTvPlayerUrl = (screenCode: string): string => {
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Production: Use tv.menupi.com
      if (hostname.includes('menupi.com')) {
        const protocol = window.location.protocol;
        const domain = hostname.split('.').slice(-2).join('.'); // Get menupi.com
        return `${protocol}//tv.${domain}/${screenCode}`;
      }
    }

    // Production fallback
    return `https://tv.menupi.com/${screenCode}`;
  } catch {
    return `https://tv.menupi.com/${screenCode}`;
  }
};

/**
 * Get the dashboard domain
 * Production: app.menupi.com
 */
export const getDashboardUrl = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Production: Use app.menupi.com
      if (hostname.includes('menupi.com')) {
        const protocol = window.location.protocol;
        const domain = hostname.split('.').slice(-2).join('.'); // Get menupi.com
        return `${protocol}//app.${domain}`;
      }
    }

    // Production fallback
    return 'https://app.menupi.com';
  } catch {
    return 'https://app.menupi.com';
  }
};

/**
 * Get the admin portal domain
 * Production: portal.menupi.com
 */
export const getAdminUrl = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Production: Use portal.menupi.com
      if (hostname.includes('menupi.com')) {
        const protocol = window.location.protocol;
        const domain = hostname.split('.').slice(-2).join('.'); // Get menupi.com
        return `${protocol}//portal.${domain}`;
      }
    }

    // Production fallback
    return 'https://portal.menupi.com';
  } catch {
    return 'https://portal.menupi.com';
  }
};


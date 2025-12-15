/**
 * Generate TV player URL for a given screen code
 * Supports both formats:
 * - menupi.com/tv/[code]
 * - tv.menupi.com/[code]
 * 
 * @param screenCode - The screen code to generate URL for
 * @param preferSubdomain - If true, prefer tv.menupi.com format, otherwise use /tv/[code] format
 * @returns The full URL to the TV player
 */
export const getTvPlayerUrl = (screenCode: string, preferSubdomain: boolean = false): string => {
  if (!screenCode) return '';
  
  const code = screenCode.toUpperCase();
  
  // If preferSubdomain is true and we're in production, use tv.menupi.com format
  if (preferSubdomain && (window.location.hostname === 'app.menupi.com' || window.location.hostname === 'menupi.com')) {
    return `https://tv.menupi.com/${code}`;
  }
  
  // Default: use /tv/[code] format (works on both main domain and subdomain)
  const origin = window.location.origin;
  return `${origin}/tv/${code}`;
};

/**
 * Get the preferred TV player URL format based on current domain
 * - On app.menupi.com: returns tv.menupi.com/[code]
 * - On tv.menupi.com: returns /[code] (relative)
 * - On localhost: returns /tv/[code]
 */
export const getPreferredTvPlayerUrl = (screenCode: string): string => {
  if (!screenCode) return '';
  
  const code = screenCode.toUpperCase();
  const hostname = window.location.hostname;
  
  // If on app.menupi.com or menupi.com, use tv subdomain
  if (hostname === 'app.menupi.com' || hostname === 'menupi.com') {
    return `https://tv.menupi.com/${code}`;
  }
  
  // If already on tv subdomain, use relative path
  if (hostname === 'tv.menupi.com' || hostname.includes('tv.')) {
    return `/${code}`;
  }
  
  // Default: use /tv/[code] format
  return `/tv/${code}`;
};


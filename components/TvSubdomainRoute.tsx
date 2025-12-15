import React, { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import PublicPlayer from '../pages/PublicPlayer';

/**
 * Route handler for tv.menupi.com/[code]
 * Only renders PublicPlayer if on tv.menupi.com subdomain
 * Otherwise redirects to dashboard
 */
const TvSubdomainRoute: React.FC = () => {
  const { screenCode } = useParams<{ screenCode: string }>();
  const hostname = window.location.hostname;

  // Check if we're on tv.menupi.com subdomain
  const isTvSubdomain = hostname === 'tv.menupi.com' || hostname === 'localhost' || hostname.includes('tv.');

  // Ensure URL stays as /[code] on TV subdomain, not /tv/[code]
  useEffect(() => {
    if (isTvSubdomain && screenCode) {
      const currentPath = window.location.pathname;
      // If URL has /tv/ prefix, remove it to keep clean /[code] format
      if (currentPath.startsWith('/tv/')) {
        window.history.replaceState(null, '', `/${screenCode}`);
      } else if (currentPath !== `/${screenCode}` && currentPath.match(/^\/[A-Z0-9]{6,}$/)) {
        // If path is correct format but doesn't match screenCode, update it
        window.history.replaceState(null, '', `/${screenCode}`);
      }
    }
  }, [isTvSubdomain, screenCode]);

  // If on TV subdomain and we have a screen code, show the player
  if (isTvSubdomain && screenCode) {
    return <PublicPlayer />;
  }

  // If on TV subdomain but no screen code, redirect to app subdomain
  // (TvSubdomainGuard should handle most redirects, but this is a fallback)
  if (isTvSubdomain && !screenCode) {
    const currentPath = window.location.pathname;
    // Only allow root path and /tv paths on TV subdomain
    if (currentPath !== '/' && !currentPath.startsWith('/tv')) {
      window.location.href = `https://app.menupi.com${currentPath}`;
      return null;
    }
  }

  // Otherwise, redirect to dashboard (or show 404 for invalid routes)
  // This prevents random paths from showing the player on main domain
  if (screenCode && !isTvSubdomain) {
    // If someone tries to access /[code] on main domain, redirect to /tv/[code]
    return <Navigate to={`/tv/${screenCode}`} replace />;
  }

  // Default redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

export default TvSubdomainRoute;


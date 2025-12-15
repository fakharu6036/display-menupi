import React from 'react';
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
  const pathname = window.location.pathname;

  // Check if we're on tv.menupi.com subdomain
  const isTvSubdomain = hostname === 'tv.menupi.com' || hostname === 'localhost' || hostname.includes('tv.');

  // If on TV subdomain and we have a screen code, show the player
  // Make sure the URL stays as /[code] and doesn't change to /tv/[code]
  if (isTvSubdomain && screenCode) {
    // If URL somehow changed to /tv/[code], redirect back to /[code]
    if (pathname.startsWith('/tv/')) {
      window.history.replaceState(null, '', `/${screenCode}`);
    }
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


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

  // Check if we're on tv.menupi.com subdomain
  const isTvSubdomain = hostname === 'tv.menupi.com' || hostname === 'localhost' || hostname.includes('tv.');

  // If on TV subdomain and we have a screen code, show the player
  if (isTvSubdomain && screenCode) {
    return <PublicPlayer />;
  }

  // If on TV subdomain but trying to access non-player routes, redirect to app subdomain
  if (isTvSubdomain && !screenCode) {
    // Redirect dashboard and other routes to app.menupi.com
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/media') || currentPath.startsWith('/screens') || currentPath.startsWith('/settings') || currentPath.startsWith('/admin')) {
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


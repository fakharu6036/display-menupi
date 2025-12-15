import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Guard component that redirects non-player routes from tv.menupi.com to app.menupi.com
 * TV subdomain should only serve player routes (/[code])
 */
const TvSubdomainGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const hostname = window.location.hostname;

  useEffect(() => {
    // Check if we're on tv.menupi.com subdomain
    const isTvSubdomain = hostname === 'tv.menupi.com' || hostname.includes('tv.');
    
    if (isTvSubdomain) {
      const pathname = location.pathname;
      
      // Allow only these routes on TV subdomain:
      // - / (root - will be handled by TvSubdomainRoute)
      // - /[code] (screen code - handled by TvSubdomainRoute)
      // - /tv (TV login page - can stay for backward compatibility)
      // - /tv/[code] (TV player with /tv prefix - can stay)
      
      // Redirect all other routes to app.menupi.com
      const allowedPaths = ['/', '/tv'];
      const isAllowedPath = allowedPaths.includes(pathname) || 
                           pathname.match(/^\/[A-Z0-9]{6,}$/) || // Screen code format
                           pathname.startsWith('/tv/'); // TV player routes
      
      if (!isAllowedPath) {
        // Redirect to app.menupi.com with the same path
        window.location.href = `https://app.menupi.com${pathname}`;
        return;
      }
    }
  }, [location.pathname, hostname]);

  // If we're on TV subdomain and this is a non-player route, don't render children
  // (redirect will happen in useEffect)
  const isTvSubdomain = hostname === 'tv.menupi.com' || hostname.includes('tv.');
  const pathname = location.pathname;
  const allowedPaths = ['/', '/tv'];
  const isAllowedPath = allowedPaths.includes(pathname) || 
                       pathname.match(/^\/[A-Z0-9]{6,}$/) || 
                       pathname.startsWith('/tv/');
  
  if (isTvSubdomain && !isAllowedPath) {
    // Show loading while redirecting
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting to app.menupi.com...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TvSubdomainGuard;


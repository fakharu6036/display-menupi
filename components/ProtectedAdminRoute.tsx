import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { UserRole } from '../types';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Check user after component mounts
    const user = StorageService.getUser();
    
    // Use setTimeout to ensure navigation happens after render
    const timer = setTimeout(() => {
      // Check if user is authenticated
      if (!user) {
        navigate('/login', { replace: true });
        setIsChecking(false);
        return;
      }
      
      // Check if user has SUPER_ADMIN role (from display-menupi repo)
      if (user.role !== UserRole.SUPER_ADMIN) {
        // On portal subdomain, stay on login. On other domains, redirect to dashboard
        const isPortal = typeof window !== 'undefined' && window.location.hostname.includes('portal.menupi.com');
        if (isPortal) {
          navigate('/login', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
        setIsChecking(false);
        return;
      }
      
      setIsChecking(false);
    }, 0);
    
    return () => clearTimeout(timer);
  }, [navigate]);
  
  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fdfbff]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f51b5] mx-auto mb-4"></div>
          <p className="text-[#44474e] font-bold">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render children if user is not authenticated or not admin
  const user = StorageService.getUser();
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }
  
  return <>{children}</>;
};


import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { UserRole } from '../types';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  
  // Check user synchronously first to avoid blank screen
  const user = StorageService.getUser();
  
  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { replace: true });
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
      return;
    }
  }, [user, navigate]);
  
  // Don't render children if user is not authenticated or not admin
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }
  
  return <>{children}</>;
};


import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { UserRole } from '../types';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const user = StorageService.getUser();
  
  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Check if user has SUPER_ADMIN role (from display-menupi repo)
    if (user.role !== UserRole.SUPER_ADMIN) {
      // Redirect to dashboard - user doesn't have admin access
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [user, navigate]);
  
  // Don't render children if user is not authenticated or not admin
  if (!user || user.role !== UserRole.SUPER_ADMIN) {
    return null;
  }
  
  return <>{children}</>;
};


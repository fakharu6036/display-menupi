import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { UserRole } from '../types';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  
  useEffect(() => {
    const user = StorageService.getUser();
    
    // Check if user is authenticated
    if (!user) {
      navigate('/login', { replace: true });
      setIsAuthorized(false);
      return;
    }
    
    // Check if user has SUPER_ADMIN role (from display-menupi repo)
    if (user.role !== UserRole.SUPER_ADMIN) {
      // Redirect to dashboard - user doesn't have admin access
      navigate('/dashboard', { replace: true });
      setIsAuthorized(false);
      return;
    }
    
    setIsAuthorized(true);
  }, [navigate]);
  
  // Don't render children until authorization is checked
  if (isAuthorized === null || !isAuthorized) {
    return null;
  }
  
  return <>{children}</>;
};


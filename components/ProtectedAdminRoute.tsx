import React from 'react';
import { Navigate } from 'react-router-dom';
import { StorageService } from '../services/storage';
import { UserRole } from '../types';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const user = StorageService.getUser();
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has SUPER_ADMIN role (from display-menupi repo)
  if (user.role !== UserRole.SUPER_ADMIN) {
    // Redirect to dashboard - user doesn't have admin access
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};


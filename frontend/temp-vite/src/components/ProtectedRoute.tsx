import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isAuthenticatedForRole, getCurrentRole } from '../utils/auth';

interface ProtectedRouteProps {
  children: JSX.Element;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check if the user has that role
  if (requiredRole) {
    if (!isAuthenticatedForRole(requiredRole)) {
      // Clear all auth data and redirect to login
      console.log(`Access denied: Required role ${requiredRole} not found`);
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute; 
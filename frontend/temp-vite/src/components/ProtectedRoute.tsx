import React from 'react';
import { Navigate } from 'react-router-dom';

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

interface ProtectedRouteProps {
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute; 
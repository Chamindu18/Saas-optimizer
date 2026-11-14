/**
 * PrivateRoute Component
 * 
 * Wraps routes that require authentication
 * If user is not logged in, redirects to /login
 * If user is logged in, renders the component
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protected route wrapper
 * Props:
 *   - children: Component to render if authenticated
 * 
 * Usage:
 * <PrivateRoute>
 *   <Dashboard />
 * </PrivateRoute>
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div role="status">Restoring session...</div>;
  // Check if user has a valid token
  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace state={{ from: { pathname: window.location.pathname } }} />;
  }

  // User is authenticated, render the component
  return children;
};

export default PrivateRoute;
export { PrivateRoute };

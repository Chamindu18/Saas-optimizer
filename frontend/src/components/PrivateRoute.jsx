/**
 * PrivateRoute Component
 * 
 * Wraps routes that require authentication
 * If user is not logged in, redirects to /login
 * If user is logged in, renders the component
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth';

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
  // Check if user has a valid token
  if (!isLoggedIn()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // User is authenticated, render the component
  return children;
};

export default PrivateRoute;

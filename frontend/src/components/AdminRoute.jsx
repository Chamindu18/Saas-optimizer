import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';

/**
 * AdminRoute Component
 * 
 * Protective route wrapper that restricts access to admin-only pages.
 * If user is not admin, redirects to dashboard with warning toast.
 * 
 * Usage:
 * <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
 */
const AdminRoute = ({ children }) => {
  const { isAdmin } = useRole();

  if (!isAdmin) {
    // Show warning toast if toast system is available
    
    // Redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
export { AdminRoute };

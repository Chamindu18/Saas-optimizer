import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useToast } from '../components/ui/ToastContainer';

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
  const { showToast } = useToast();

  if (!isAdmin) {
    // Show warning toast if toast system is available
    if (showToast) {
      showToast('Admin access required', 'warning');
    }
    
    // Redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;

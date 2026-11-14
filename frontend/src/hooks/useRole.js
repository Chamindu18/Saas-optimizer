import { useAuth } from '../context/AuthContext';

/**
 * useRole Hook
 * 
 * Decodes JWT token to extract user's role and provides helper methods
 * for permission checking throughout the frontend.
 * 
 * Returns:
 * - role: User's current role ('admin', 'manager', 'viewer', or null)
 * - isAdmin: Boolean - true if user is admin
 * - isManager: Boolean - true if user is admin or manager
 * - isViewer: Boolean - true for all authenticated users
 * - can: Function(action) - checks if user can perform specific action
 */
export const useRole = () => {
  const { user } = useAuth();
  const role = user?.role;

  // If no token, return default (not authenticated)
  if (!role) {
    return {
      role: null,
      isAdmin: false,
      isManager: false,
      isViewer: false,
      can: () => false,
    };
  }

  try {
    return {
      role,
      isAdmin: role === 'admin',
      isManager: role === 'admin' || role === 'manager',
      isViewer: true, // All authenticated users can view

      // Helper method: can(action) returns true/false for specific actions
      // Permissions defined here control what buttons/features show in UI
      can: (action) => {
        const permissions = {
          // Software management
          addSoftware: ['admin', 'manager'],
          deleteSoftware: ['admin'],
          updateSoftware: ['admin', 'manager'],

          // License management
          assignLicense: ['admin', 'manager'],
          pruneLicense: ['admin'], // High-risk action, admin only
          deleteLicense: ['admin'],
          updateLicense: ['admin', 'manager'],

          // Employee/User management
          addEmployee: ['admin', 'manager'],
          deleteEmployee: ['admin', 'manager'],

          // Dashboard access (all authenticated users)
          viewDashboard: ['admin', 'manager', 'viewer'],

          // Admin-only features
          manageRoles: ['admin'],
          viewRoleManagement: ['admin'],
        };

        // Check if current role has permission for this action
        return permissions[action]?.includes(role) ?? false;
      },
    };
  } catch (error) {
    // Token is malformed or can't be decoded
    console.error('Error decoding token:', error);
    return {
      role: null,
      isAdmin: false,
      isManager: false,
      isViewer: false,
      can: () => false,
    };
  }
};

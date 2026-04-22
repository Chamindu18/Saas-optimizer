import React from 'react';
import { useRole } from '../hooks/useRole';
import '../styles/RoleGuard.css';

/**
 * RoleGuard Component
 * 
 * Wraps UI elements that should only be visible to certain roles.
 * Shows a disabled version with tooltip instead of hiding completely
 * (better UX - user understands why they can't click).
 * 
 * Props:
 * - action: String - Permission action to check (e.g., 'pruneLicense')
 * - children: ReactNode - The UI element to guard
 * - fallback: 'disabled' | null (default null)
 *   - null: Element is completely hidden if user doesn't have permission
 *   - 'disabled': Element is shown but disabled with tooltip
 * 
 * Examples:
 * <RoleGuard action="pruneLicense" fallback="disabled">
 *   <button>Prune Seat</button>
 * </RoleGuard>
 * 
 * <RoleGuard action="manageRoles">
 *   <Settings />
 * </RoleGuard>
 */
const RoleGuard = ({ action, children, fallback = null }) => {
  const { can, role } = useRole();

  // User has permission - render normally
  if (can(action)) {
    return children;
  }

  // User doesn't have permission
  if (fallback === 'disabled') {
    // Show disabled version with tooltip explaining why
    return (
      <div
        className="role-guard-disabled"
        title={`Requires admin access (your role: ${role || 'viewer'})`}
      >
        <div className="role-guard-disabled-content">
          {children}
        </div>
      </div>
    );
  }

  // Default: hide completely
  return null;
};

export default RoleGuard;

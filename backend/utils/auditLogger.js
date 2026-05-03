/**
 * Audit Logger Utility
 * 
 * Logs administrative actions to the audit_logs table
 * Called after every admin action (role change, prune, delete, add software, etc.)
 * 
 * Never blocks the main action if logging fails - errors are logged to console only
 */

import pool from '../config/db.js';

/**
 * Log an administrative action to the audit_logs table
 * 
 * Args:
 *   userId     - ID of the admin performing the action
 *   userName   - Name/email of the admin
 *   userRole   - Role of the admin ('admin', 'manager', 'viewer')
 *   action     - Type of action (e.g., 'ROLE_CHANGE', 'PRUNE_SEAT', 'DELETE_USER')
 *   targetType - Type of object being affected (e.g., 'user', 'license', 'software')
 *   targetId   - ID of the object being affected
 *   targetName - Display name of the object (e.g., "John Doe", "Microsoft Office")
 *   details    - Additional context (e.g., "Saved $50/month", "Changed from viewer to manager")
 *   ipAddress  - IP address of the request (from req.ip)
 * 
 * Returns: Promise that resolves when log is written (but doesn't throw)
 */
const logAction = async ({
  userId,
  userName,
  userRole,
  action,
  targetType,
  targetId,
  targetName,
  details,
  ipAddress,
}) => {
  try {
    // Validate required fields
    if (!userId || !action) {
      console.warn('Audit log: Missing required fields (userId or action)');
      return;
    }

    await pool.query(
      `INSERT INTO audit_logs
        (user_id, user_name, user_role, action, target_type, target_id, target_name, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, userName, userRole, action, targetType, targetId, targetName, details, ipAddress]
    );

    console.log(`[AUDIT] ${action} by ${userName} (${userRole})`);
  } catch (err) {
    // Never let audit logging crash the main action
    // Just log the error to console
    console.error('[AUDIT ERROR] Failed to log action:', {
      action,
      userName,
      error: err.message,
    });
  }
};

export default logAction;

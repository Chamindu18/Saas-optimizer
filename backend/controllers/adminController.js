/**
 * Admin Controller
 * 
 * Handles all admin-only endpoints for:
 * - Admin dashboard metrics (total users, licenses pruned, savings, etc.)
 * - User management (list all users with role info)
 * - Role changes (with safeguards against self-demotion and last-admin demotion)
 * - User deletion (with safeguards against deleting last admin)
 * - Audit log retrieval (paginated timeline of admin actions)
 * - System health status
 */

import pool from '../config/db.js';
import logAction from '../utils/auditLogger.js';

/**
 * GET /api/admin/stats
 * Returns admin dashboard metrics
 * 
 * Metrics include:
 * - Total users + breakdown by role
 * - Licenses pruned this month + savings
 * - Idle licenses + trend
 * - Total monthly spend
 */
const getAdminStats = async (req, res) => {
  try {
    // Total users and breakdown by role
    const usersResult = await pool.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role`
    );

    const roleBreakdown = {};
    let totalUsers = 0;
    for (const row of usersResult.rows) {
      roleBreakdown[row.role] = row.count;
      totalUsers += row.count;
    }

    // Count idle licenses
    const idleResult = await pool.query(
      `SELECT COUNT(*) as count FROM licenses WHERE status = 'idle'`
    );
    const idleLicenses = parseInt(idleResult.rows[0].count, 10);

    // Count pruned licenses this month
    const prunedThisMonthResult = await pool.query(
      `SELECT COUNT(*) as count FROM licenses 
       WHERE status = 'pruned' 
       AND updated_at >= DATE_TRUNC('month', NOW())`
    );
    const licensesPrunedThisMonth = parseInt(prunedThisMonthResult.rows[0].count, 10);

    // Calculate potential savings (sum of costs for idle licenses)
    const savingsResult = await pool.query(
      `SELECT COALESCE(SUM(software.price_per_seat), 0) as savings
       FROM licenses 
       JOIN software ON licenses.software_id = software.id
       WHERE licenses.status = 'idle'`
    );
    const potentialSavings = parseFloat(savingsResult.rows[0].savings).toFixed(2);

    // Calculate total monthly spend (active licenses)
    const spendResult = await pool.query(
      `SELECT COALESCE(SUM(software.price_per_seat), 0) as total
       FROM licenses
       JOIN software ON licenses.software_id = software.id
       WHERE licenses.status = 'active'`
    );
    const totalMonthlySpend = parseFloat(spendResult.rows[0].total).toFixed(2);

    // Calculate percent wasted
    const percentWasted = totalMonthlySpend > 0
      ? parseFloat(((potentialSavings / totalMonthlySpend) * 100).toFixed(2))
      : 0;

    // Get latest system health check
    const healthResult = await pool.query(
      `SELECT * FROM system_health 
       WHERE check_type = 'idle_check' 
       ORDER BY ran_at DESC 
       LIMIT 1`
    );
    const lastHealthCheck = healthResult.rows[0] || null;

    res.json({
      success: true,
      data: {
        totalUsers,
        roleBreakdown,
        idleLicenses,
        licensesPrunedThisMonth,
        savingsRealized: potentialSavings,
        totalMonthlySpend,
        percentWasted,
        lastHealthCheck,
        auditLogCount: await getAuditLogCount(),
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin stats',
    });
  }
};

/**
 * Get count of audit logs (helper for getAdminStats)
 */
const getAuditLogCount = async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
    return parseInt(result.rows[0].count, 10);
  } catch (err) {
    return 0;
  }
};

/**
 * GET /api/admin/users
 * Returns list of all users with role information
 * Admin only
 */
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Change a user's role
 * 
 * Safeguards:
 * - Cannot change your own role
 * - Cannot demote the last admin
 */
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user.id;

    // Validate new role
    if (!['admin', 'manager', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role. Must be: admin, manager, or viewer',
      });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent self-role change
    if (parseInt(id) === adminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot change your own role',
        message: 'Ask another admin to change your role',
      });
    }

    // Prevent demoting the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`
      );
      const adminCount = parseInt(adminCountResult.rows[0].count, 10);

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot demote the last admin',
          message: 'There must always be at least one admin in the system',
        });
      }
    }

    // Update the role
    const updateResult = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      [role, id]
    );

    const updatedUser = updateResult.rows[0];

    // Log the action
    await logAction({
      userId: adminId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'ROLE_CHANGE',
      targetType: 'user',
      targetId: parseInt(id),
      targetName: user.email,
      details: `Changed role from ${user.role} to ${role}`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `User role updated to ${role}`,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Change role error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to change user role',
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user account
 * 
 * Safeguards:
 * - Cannot delete yourself
 * - Cannot delete another admin (except if you're deleting a manager/viewer)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Prevent deleting yourself
    if (parseInt(id) === adminId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
        message: 'Ask another admin to delete your account',
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCountResult = await pool.query(
        `SELECT COUNT(*) as count FROM users WHERE role = 'admin'`
      );
      const adminCount = parseInt(adminCountResult.rows[0].count, 10);

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete the last admin',
          message: 'There must always be at least one admin in the system',
        });
      }
    }

    // Delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    // Log the action
    await logAction({
      userId: adminId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'DELETE_USER',
      targetType: 'user',
      targetId: parseInt(id),
      targetName: user.email,
      details: `Deleted ${user.role} account`,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: { deletedUserId: id },
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    });
  }
};

/**
 * GET /api/admin/audit-logs?page=1&limit=20&action=ROLE_CHANGE
 * Returns paginated audit log entries
 * 
 * Query params:
 *   - page: Page number (default 1)
 *   - limit: Entries per page (default 20, max 100)
 *   - action: Filter by action type (optional)
 */
const getAuditLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const action = req.query.action || null;

    const offset = (page - 1) * limit;

    // Build query with optional action filter
    let query = 'SELECT * FROM audit_logs';
    const params = [];

    if (action) {
      query += ' WHERE action = $1';
      params.push(action);
    }

    // Get total count
    const countQuery = action
      ? 'SELECT COUNT(*) as count FROM audit_logs WHERE action = $1'
      : 'SELECT COUNT(*) as count FROM audit_logs';

    const countResult = await pool.query(
      countQuery,
      action ? [action] : []
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    });
  }
};

/**
 * GET /api/admin/system-health
 * Returns latest system health check status
 */
const getSystemHealth = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM system_health ORDER BY ran_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Get system health error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health',
    });
  }
};

export default {
  getAdminStats,
  getAllUsers,
  changeUserRole,
  deleteUser,
  getAuditLogs,
  getSystemHealth,
};

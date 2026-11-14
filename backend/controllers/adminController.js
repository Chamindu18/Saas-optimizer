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
import userController from './userController.js';

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
      const count = parseInt(row.count, 10);
      roleBreakdown[row.role.trim()] = count;
      totalUsers += count;
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
    const potentialSavings = parseFloat(savingsResult.rows[0].savings);

    // Calculate total monthly spend (active licenses)
    const spendResult = await pool.query(
      `SELECT COALESCE(SUM(software.price_per_seat), 0) as total
       FROM licenses
       JOIN software ON licenses.software_id = software.id
       WHERE licenses.status = 'active'`
    );
    const totalMonthlySpend = parseFloat(spendResult.rows[0].total);

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
        savingsRealized: parseFloat(potentialSavings.toFixed(2)),
        totalMonthlySpend: parseFloat(totalMonthlySpend.toFixed(2)),
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
const changeUserRole = userController.updateUserRole;
const deleteUser = userController.deleteUser;

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

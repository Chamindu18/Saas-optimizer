/**
 * Dashboard Stats Controller
 *
 * Returns real analytics data for the authenticated dashboard.
 */

import pool from '../config/db.js';
import licenseService from '../services/licenseService.js';
import { effectiveStatus } from '../services/licenseRules.js';

/**
 * GET /api/dashboard/stats
 * Returns dashboard metrics: licenses, users, software counts, recent activity.
 */
const getDashboardStats = async (req, res) => {
  try {
    // Fetch counts in parallel
    const [
      licenseCountResult,
      activeUsersResult,
      softwareCountResult,
      metricResult,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM licenses'),
      pool.query(`SELECT COUNT(DISTINCT employee_id) AS count FROM licenses WHERE ${effectiveStatus} = 'active'`),
      pool.query('SELECT COUNT(*) AS count FROM software'),
      licenseService.metrics(),
    ]);

    const totalLicenses = parseInt(licenseCountResult.rows[0].count, 10);
    const activeUsers = parseInt(activeUsersResult.rows[0].count, 10);
    const totalSoftware = parseInt(softwareCountResult.rows[0].count, 10);
    const totalSpend = metricResult.totalSpend;

    // Recent licenses added (last 30 days)
    const recentLicensesResult = await pool.query(
      `SELECT COUNT(*) as count FROM licenses 
       WHERE assigned_date >= NOW() - INTERVAL '30 days'`
    );
    const recentLicenses = parseInt(recentLicensesResult.rows[0].count, 10);

    // Top 5 most used software
    const topSoftwareResult = await pool.query(
      `SELECT software.id, software.name, COUNT(licenses.id) as license_count
       FROM software
       LEFT JOIN licenses ON software.id = licenses.software_id AND licenses.status <> 'pruned'
       GROUP BY software.id, software.name
       ORDER BY license_count DESC
       LIMIT 5`
    );
    const topSoftware = topSoftwareResult.rows;

    res.json({
      success: true,
      data: {
        totalLicenses,
        activeUsers,
        totalSoftware,
        totalSpend,
        activeLicenseCount: metricResult.activeLicenseCount,
        idleLicenseCount: metricResult.idleLicenseCount,
        prunedLicenseCount: metricResult.prunedLicenseCount,
        potentialSavings: metricResult.potentialSavings,
        savingsPercentage: metricResult.savingsPercentage,
        spendingByCategory: metricResult.spendingByCategory,
        recentLicenses,
        topSoftware,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard stats',
    });
  }
};

export default {
  getDashboardStats,
};

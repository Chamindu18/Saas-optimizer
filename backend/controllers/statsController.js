/**
 * Stats Controller
 *
 * Lightweight organizational counts for authenticated accounts.
 */

import pool from '../config/db.js';

/**
 * GET /api/stats/home
 * Returns shared workspace counts to an authenticated account.
 */
const getHomeStats = async (req, res) => {
  try {
    const [usersResult, softwareResult, licensesResult] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM employees'),
      pool.query('SELECT COUNT(*) AS count FROM software'),
      pool.query('SELECT COUNT(*) AS count FROM licenses'),
    ]);

    const totalUsers = parseInt(usersResult.rows[0].count, 10);
    const totalSoftware = parseInt(softwareResult.rows[0].count, 10);
    const totalLicenses = parseInt(licensesResult.rows[0].count, 10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSoftware,
        totalLicenses,
      },
    });
  } catch (error) {
    console.error('Home stats error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch home stats',
    });
  }
};

export default {
  getHomeStats,
};

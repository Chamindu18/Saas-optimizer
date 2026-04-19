/**
 * Dashboard Service
 * Calculates analytics: total spend, potential savings, idle users
 */

import pool from '../config/db.js';
import LicenseModel from '../models/License.js';

const getTotalSpend = async () => {
  try {
    const query = `
      SELECT COALESCE(SUM(software.price_per_seat), 0) as total_spend
      FROM licenses
      JOIN software ON licenses.software_id = software.id
      WHERE licenses.status = 'active'
    `;
    const result = await pool.query(query);
    return { totalSpend: parseFloat(result.rows[0].total_spend).toFixed(2) };
  } catch (error) {
    throw new Error(`Failed to calculate total spend: ${error.message}`);
  }
};

const getPotentialSavings = async () => {
  try {
    const query = `
      SELECT COALESCE(SUM(software.price_per_seat), 0) as potential_savings
      FROM licenses
      JOIN software ON licenses.software_id = software.id
      WHERE licenses.status = 'idle'
    `;
    const result = await pool.query(query);
    return { potentialSavings: parseFloat(result.rows[0].potential_savings).toFixed(2) };
  } catch (error) {
    throw new Error(`Failed to calculate potential savings: ${error.message}`);
  }
};

const getActiveLicenseCount = async () => {
  try {
    const query = `
      SELECT COUNT(*) as active_count
      FROM licenses
      WHERE licenses.status = 'active'
    `;
    const result = await pool.query(query);
    return { activeLicenses: parseInt(result.rows[0].active_count, 10) };
  } catch (error) {
    throw new Error(`Failed to get active license count: ${error.message}`);
  }
};

const getIdleUsers = async () => {
  try {
    const usersQuery = `
      SELECT DISTINCT users.id, users.name, users.email
      FROM users
      JOIN licenses ON users.id = licenses.user_id
      WHERE licenses.status = 'idle'
      ORDER BY users.id ASC
    `;
    const usersResult = await pool.query(usersQuery);
    const idleUsers = [];

    for (const user of usersResult.rows) {
      const licensesQuery = `
        SELECT licenses.id, licenses.software_id, software.name as software_name, licenses.last_active_date
        FROM licenses
        JOIN software ON licenses.software_id = software.id
        WHERE licenses.user_id = $1 AND licenses.status = 'idle'
      `;
      const licensesResult = await pool.query(licensesQuery, [user.id]);
      
      idleUsers.push({
        id: user.id,
        name: user.name,
        email: user.email,
        idleCount: licensesResult.rows.length,
        idleLicenses: licensesResult.rows.map(l => ({
          softwareId: l.software_id,
          softwareName: l.software_name,
          lastActiveDate: l.last_active_date,
        })),
      });
    }

    return { idleUsers };
  } catch (error) {
    throw new Error(`Failed to get idle users: ${error.message}`);
  }
};

const getDashboardData = async () => {
  try {
    // Update idle status for active licenses
    const allLicenses = await pool.query(`
      SELECT id, last_active_date FROM licenses WHERE status = 'active'
    `);

    for (const license of allLicenses.rows) {
      const idleStatus = LicenseModel.checkIfIdle(license.last_active_date);
      if (idleStatus === 'idle') {
        await pool.query('UPDATE licenses SET status = $1 WHERE id = $2', ['idle', license.id]);
      }
    }

    const [spend, savings, count, users] = await Promise.all([
      getTotalSpend(),
      getPotentialSavings(),
      getActiveLicenseCount(),
      getIdleUsers(),
    ]);

    const totalSpend = parseFloat(spend.totalSpend);
    const potentialSavings = parseFloat(savings.potentialSavings);
    const percentageWasted = totalSpend > 0 ? ((potentialSavings / totalSpend) * 100).toFixed(2) : 0;

    return {
      metrics: {
        totalSpend,
        potentialSavings,
        activeLicenses: count.activeLicenses,
        idleCount: users.idleUsers.reduce((sum, u) => sum + u.idleCount, 0),
        percentageOfSpendBeingWasted: parseFloat(percentageWasted),
        savingsOpportunity: potentialSavings > 0 
          ? `You can save $${potentialSavings.toFixed(2)} by removing idle licenses`
          : 'No idle licenses to remove',
      },
      users: users.idleUsers,
    };
  } catch (error) {
    throw new Error(`Failed to get dashboard data: ${error.message}`);
  }
};

const getLicenseSummary = async () => {
  try {
    const query = `
      SELECT status, COUNT(*) as count
      FROM licenses
      GROUP BY status
    `;
    const result = await pool.query(query);
    const summary = { active: 0, idle: 0, pruned: 0 };
    
    result.rows.forEach(row => {
      if (row.status in summary) {
        summary[row.status] = parseInt(row.count, 10);
      }
    });

    return summary;
  } catch (error) {
    throw new Error(`Failed to get license summary: ${error.message}`);
  }
};

export default {
  getTotalSpend,
  getPotentialSavings,
  getActiveLicenseCount,
  getIdleUsers,
  getDashboardData,
  getLicenseSummary,
};

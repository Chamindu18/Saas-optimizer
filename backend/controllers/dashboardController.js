/**
 * Dashboard Controller
 * 
 * Controllers handle HTTP requests and responses.
 * They call services to perform business logic, then format and return the response.
 * Controllers should be thin and avoid complex business logic.
 */

import dashboardService from '../services/dashboardService.js';

/**
 * GET /api/dashboard
 * Get complete dashboard analytics data
 * 
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     totalSpend: number,
 *     potentialSavings: number,
 *     activeLicenses: number,
 *     idleUsers: array
 *   }
 * }
 */
const getDashboardData = async (req, res) => {
  try {
    // Call the dashboard service to get all analytics
    const dashboardData = await dashboardService.getDashboardData();

    // Return success response with dashboard data
    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    // Return error response if something went wrong
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/dashboard/summary
 * Get quick license summary (active, idle, pruned counts)
 * 
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     active: number,
 *     idle: number,
 *     pruned: number
 *   }
 * }
 */
const getLicenseSummary = async (req, res) => {
  try {
    // Call the dashboard service to get license summary
    const summary = await dashboardService.getLicenseSummary();

    // Return success response with summary data
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    // Return error response if something went wrong
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getDashboardData,
  getLicenseSummary,
};

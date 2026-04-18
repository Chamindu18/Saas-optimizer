/**
 * License Controller
 * 
 * Handles HTTP requests for licenses.
 * Calls services for business logic including idle detection and spend calculations.
 */

import licenseService from '../services/licenseService.js';

/**
 * GET /api/licenses
 * Get all licenses
 */
const getLicenses = async (req, res) => {
  try {
    const licenses = await licenseService.getAllLicenses();
    res.json({
      success: true,
      data: licenses,
      count: licenses.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/licenses/:id
 * Get a single license by ID
 */
const getLicenseById = async (req, res) => {
  try {
    const { id } = req.params;
    const license = await licenseService.getLicenseById(id);

    if (!license) {
      return res.status(404).json({
        success: false,
        error: 'License not found',
      });
    }

    res.json({
      success: true,
      data: license,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/licenses
 * Assign a license to a user
 * 
 * Request body:
 * {
 *   "user_id": 1,
 *   "software_id": 2
 * }
 */
const assignLicense = async (req, res) => {
  try {
    const { user_id, software_id } = req.body;

    const newLicense = await licenseService.assignLicense({
      user_id,
      software_id,
    });

    res.status(201).json({
      success: true,
      message: 'License assigned successfully',
      data: newLicense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/licenses/:id
 * Update a license
 * 
 * Request body (partial):
 * {
 *   "status": "active"
 * }
 */
const updateLicense = async (req, res) => {
  try {
    const { id } = req.params;
    const { last_active_date, status } = req.body;

    const updatedLicense = await licenseService.updateLicense(id, {
      last_active_date,
      status,
    });

    res.json({
      success: true,
      message: 'License updated successfully',
      data: updatedLicense,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/licenses/:id
 * Delete a license
 */
const deleteLicense = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedLicense = await licenseService.deleteLicense(id);

    res.json({
      success: true,
      message: 'License deleted successfully',
      data: deletedLicense,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/licenses/:id/prune
 * Prune (disable) a license
 * Changes status from 'active' to 'pruned'
 */
const pruneLicense = async (req, res) => {
  try {
    const { id } = req.params;

    const prunedLicense = await licenseService.pruneLicense(id);

    res.json({
      success: true,
      message: 'License pruned successfully',
      data: prunedLicense,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/licenses/dashboard/metrics
 * Get dashboard data
 * Returns: total spend, idle count, potential savings, and other metrics
 */
const getDashboardData = async (req, res) => {
  try {
    const dashboardData = await licenseService.getDashboardData();

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/licenses/idle/list
 * Get all idle licenses
 * Returns licenses that haven't been used in 30+ days
 */
const getIdleLicenses = async (req, res) => {
  try {
    const idleLicenses = await licenseService.detectIdleLicenses();

    res.json({
      success: true,
      data: idleLicenses,
      count: idleLicenses.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getLicenses,
  getLicenseById,
  assignLicense,
  updateLicense,
  deleteLicense,
  pruneLicense,
  getDashboardData,
  getIdleLicenses,
};

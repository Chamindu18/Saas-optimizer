/**
 * License Service
 * 
 * Contains all business logic related to licenses.
 * Handles core features like idle detection, spend calculation, etc.
 */

import LicenseModel from '../models/License.js';
import SoftwareModel from '../models/Software.js';
import UserModel from '../models/User.js';

/**
 * Get all licenses
 */
const getAllLicenses = async () => {
  try {
    return LicenseModel.getAllLicenses();
  } catch (error) {
    throw new Error(`Failed to fetch licenses: ${error.message}`);
  }
};

/**
 * Get license by ID
 */
const getLicenseById = async (licenseId) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }
    return LicenseModel.getLicenseById(Number(licenseId));
  } catch (error) {
    throw new Error(`Failed to fetch license: ${error.message}`);
  }
};

/**
 * Assign a license to a user
 * Creates a new license linking a user to software
 */
const assignLicense = async (licenseData) => {
  try {
    // Validation
    if (!licenseData.user_id || !licenseData.software_id) {
      throw new Error('User ID and Software ID are required');
    }

    // Check if user exists
    const user = UserModel.getUserById(Number(licenseData.user_id));
    if (!user) {
      throw new Error('User not found');
    }

    // Check if software exists
    const software = SoftwareModel.getSoftwareById(Number(licenseData.software_id));
    if (!software) {
      throw new Error('Software not found');
    }

    return LicenseModel.createLicense(licenseData);
  } catch (error) {
    throw new Error(`Failed to assign license: ${error.message}`);
  }
};

/**
 * Update a license
 */
const updateLicense = async (licenseId, licenseData) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const license = LicenseModel.getLicenseById(Number(licenseId));
    if (!license) {
      throw new Error('License not found');
    }

    return LicenseModel.updateLicense(Number(licenseId), licenseData);
  } catch (error) {
    throw new Error(`Failed to update license: ${error.message}`);
  }
};

/**
 * Prune (delete) a license
 * When a license is removed, its status changes to "pruned"
 */
const pruneLicense = async (licenseId) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const license = LicenseModel.getLicenseById(Number(licenseId));
    if (!license) {
      throw new Error('License not found');
    }

    return LicenseModel.updateLicense(Number(licenseId), { status: 'pruned' });
  } catch (error) {
    throw new Error(`Failed to prune license: ${error.message}`);
  }
};

/**
 * Delete a license
 */
const deleteLicense = async (licenseId) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const license = LicenseModel.getLicenseById(Number(licenseId));
    if (!license) {
      throw new Error('License not found');
    }

    return LicenseModel.deleteLicense(Number(licenseId));
  } catch (error) {
    throw new Error(`Failed to delete license: ${error.message}`);
  }
};

/**
 * Calculate total spend
 * Sum of all active licenses
 * 
 * Formula: Sum of (license.software.price_per_seat) for all active licenses
 */
const calculateTotalSpend = async () => {
  try {
    const licenses = LicenseModel.getAllLicenses();
    const activeLicenses = licenses.filter(license => license.status === 'active');

    let totalSpend = 0;
    activeLicenses.forEach(license => {
      const software = SoftwareModel.getSoftwareById(license.software_id);
      if (software) {
        totalSpend += software.price_per_seat;
      }
    });

    return {
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      activeLicenseCount: activeLicenses.length,
    };
  } catch (error) {
    throw new Error(`Failed to calculate total spend: ${error.message}`);
  }
};

/**
 * Detect idle licenses
 * A license is idle if last_active_date is more than 30 days old
 * 
 * Returns licenses that are currently active but haven't been used in 30+ days
 */
const detectIdleLicenses = async () => {
  try {
    const licenses = LicenseModel.getAllLicenses();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const idleLicenses = licenses.filter(license => {
      // Only check active licenses that haven't been used recently
      if (license.status !== 'active') return false;
      return new Date(license.last_active_date) < thirtyDaysAgo;
    });

    return idleLicenses;
  } catch (error) {
    throw new Error(`Failed to detect idle licenses: ${error.message}`);
  }
};

/**
 * Calculate potential savings
 * Sum of costs of all idle licenses
 */
const calculatePotentialSavings = async () => {
  try {
    const idleLicenses = await detectIdleLicenses();

    let potentialSavings = 0;
    idleLicenses.forEach(license => {
      const software = SoftwareModel.getSoftwareById(license.software_id);
      if (software) {
        potentialSavings += software.price_per_seat;
      }
    });

    return {
      potentialSavings: parseFloat(potentialSavings.toFixed(2)),
      idleLicenseCount: idleLicenses.length,
      idleLicenses,
    };
  } catch (error) {
    throw new Error(`Failed to calculate potential savings: ${error.message}`);
  }
};

/**
 * Get dashboard data
 * Returns key metrics: total spend, idle count, and potential savings
 */
const getDashboardData = async () => {
  try {
    const spendData = await calculateTotalSpend();
    const savingsData = await calculatePotentialSavings();

    return {
      totalSpend: spendData.totalSpend,
      activeLicenseCount: spendData.activeLicenseCount,
      idleLicenseCount: savingsData.idleLicenseCount,
      potentialSavings: savingsData.potentialSavings,
      metrics: {
        percentageOfSpendBeingWasted: spendData.totalSpend > 0
          ? parseFloat(((savingsData.potentialSavings / spendData.totalSpend) * 100).toFixed(2))
          : 0,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get dashboard data: ${error.message}`);
  }
};

export default {
  getAllLicenses,
  getLicenseById,
  assignLicense,
  updateLicense,
  pruneLicense,
  deleteLicense,
  calculateTotalSpend,
  detectIdleLicenses,
  calculatePotentialSavings,
  getDashboardData,
};

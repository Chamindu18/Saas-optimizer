/**
 * License Service
 * 
 * Contains all business logic related to licenses.
 * Handles core features like idle detection, spend calculation, etc.
 * 
 * IMPORTANT: All LicenseModel calls use 'await' because Model functions return Promises.
 * Without await, functions return unresolved Promises instead of actual data.
 * This ensures data flows correctly: Controller → Service (await) → Model (await) → Database
 */

import LicenseModel from '../models/License.js';
import SoftwareModel from '../models/Software.js';
import UserModel from '../models/User.js';

/**
 * Get all licenses
 * Automatically updates status based on idle logic
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from LicenseModel
 */
const getAllLicenses = async () => {
  try {
    let licenses = await LicenseModel.getAllLicenses();
    
    // Update status based on idle logic (if status was 'active')
    licenses = licenses.map(license => {
      if (license.status === 'active') {
        const calculatedStatus = LicenseModel.checkIfIdle(license.last_active_date);
        return { ...license, status: calculatedStatus };
      }
      return license;
    });
    
    return licenses;
  } catch (error) {
    throw new Error(`Failed to fetch licenses: ${error.message}`);
  }
};

/**
 * Get license by ID
 * Automatically updates status based on idle logic
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from LicenseModel
 */
const getLicenseById = async (licenseId) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }
    let license = await LicenseModel.getLicenseById(Number(licenseId));
    
    if (!license) {
      return null;
    }
    
    // Update status based on idle logic (if status was 'active')
    if (license.status === 'active') {
      const calculatedStatus = LicenseModel.checkIfIdle(license.last_active_date);
      license = { ...license, status: calculatedStatus };
    }
    
    return license;
  } catch (error) {
    throw new Error(`Failed to fetch license: ${error.message}`);
  }
};

/**
 * Assign a license to a user
 * Creates a new license linking a user to software
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from Model calls
 */
const assignLicense = async (licenseData) => {
  try {
    // Validation
    if (!licenseData.user_id || !licenseData.software_id) {
      throw new Error('User ID and Software ID are required');
    }

    // Check if user exists (must await!)
    const user = await UserModel.getUserById(Number(licenseData.user_id));
    if (!user) {
      throw new Error('User not found');
    }

    // Check if software exists (must await!)
    const software = await SoftwareModel.getSoftwareById(Number(licenseData.software_id));
    if (!software) {
      throw new Error('Software not found');
    }

    const newLicense = await LicenseModel.createLicense(licenseData);
    return newLicense;
  } catch (error) {
    throw new Error(`Failed to assign license: ${error.message}`);
  }
};

/**
 * Update a license
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from LicenseModel
 */
const updateLicense = async (licenseId, licenseData) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const license = await LicenseModel.getLicenseById(Number(licenseId));
    if (!license) {
      throw new Error('License not found');
    }

    const updatedLicense = await LicenseModel.updateLicense(Number(licenseId), licenseData);
    return updatedLicense;
  } catch (error) {
    throw new Error(`Failed to update license: ${error.message}`);
  }
};

/**
 * Prune (delete) a license
 * When a license is removed, its status changes to "pruned"
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from LicenseModel
 */
const pruneLicense = async (licenseId) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const license = await LicenseModel.getLicenseById(Number(licenseId));
    if (!license) {
      throw new Error('License not found');
    }

    return await LicenseModel.updateLicense(Number(licenseId), { 
      user_id: license.user_id,
      software_id: license.software_id,
      assigned_date: license.assigned_date,
      last_active_date: license.last_active_date,
      status: 'pruned'
    });
  } catch (error) {
    throw new Error(`Failed to prune license: ${error.message}`);
  }
};

/**
 * Delete a license
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from LicenseModel
 */
const deleteLicense = async (licenseId) => {
  try {
    if (!licenseId) {
      throw new Error('License ID is required');
    }

    const license = await LicenseModel.getLicenseById(Number(licenseId));
    if (!license) {
      throw new Error('License not found');
    }

    return await LicenseModel.deleteLicense(Number(licenseId));
  } catch (error) {
    throw new Error(`Failed to delete license: ${error.message}`);
  }
};

/**
 * Calculate total spend
 * Sum of all active licenses
 * 
 * Formula: Sum of (license.software.price_per_seat) for all active licenses
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from getAllLicenses
 */
const calculateTotalSpend = async () => {
  try {
    const licenses = await LicenseModel.getAllLicenses();
    const activeLicenses = licenses.filter(license => license.status === 'active');

    let totalSpend = 0;
    for (const license of activeLicenses) {
      const software = await SoftwareModel.getSoftwareById(license.software_id);
      if (software) {
        totalSpend += software.price_per_seat;
      }
    }

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
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from getAllLicenses
 */
const detectIdleLicenses = async () => {
  try {
    const licenses = await LicenseModel.getAllLicenses();

    const idleLicenses = licenses.filter(license => {
      // Only check active licenses
      if (license.status !== 'active') return false;
      
      // Use the model's checkIfIdle logic
      const idleStatus = LicenseModel.checkIfIdle(license.last_active_date);
      return idleStatus === 'idle';
    });

    return idleLicenses;
  } catch (error) {
    throw new Error(`Failed to detect idle licenses: ${error.message}`);
  }
};

/**
 * Calculate potential savings
 * Sum of costs of all idle licenses
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from detectIdleLicenses
 */
const calculatePotentialSavings = async () => {
  try {
    const idleLicenses = await detectIdleLicenses();

    let potentialSavings = 0;
    for (const license of idleLicenses) {
      const software = await SoftwareModel.getSoftwareById(license.software_id);
      if (software) {
        potentialSavings += software.price_per_seat;
      }
    }

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
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from service functions
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

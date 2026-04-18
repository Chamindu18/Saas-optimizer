/**
 * Software Service
 * 
 * Contains all business logic related to software/tools.
 * Services abstract the database operations and are used by controllers.
 */

import SoftwareModel from '../models/Software.js';

/**
 * Get all software
 */
const getAllSoftware = async () => {
  try {
    return SoftwareModel.getAllSoftware();
  } catch (error) {
    throw new Error(`Failed to fetch software: ${error.message}`);
  }
};

/**
 * Get software by ID
 */
const getSoftwareById = async (softwareId) => {
  try {
    if (!softwareId) {
      throw new Error('Software ID is required');
    }
    return SoftwareModel.getSoftwareById(Number(softwareId));
  } catch (error) {
    throw new Error(`Failed to fetch software: ${error.message}`);
  }
};

/**
 * Create new software
 * Validates input and creates a new software record
 */
const createSoftware = async (softwareData) => {
  try {
    // Validation
    if (!softwareData.name || !softwareData.category || softwareData.price_per_seat === undefined) {
      throw new Error('Name, category, and price per seat are required');
    }

    if (softwareData.price_per_seat < 0) {
      throw new Error('Price per seat cannot be negative');
    }

    return SoftwareModel.createSoftware(softwareData);
  } catch (error) {
    throw new Error(`Failed to create software: ${error.message}`);
  }
};

/**
 * Update software
 */
const updateSoftware = async (softwareId, softwareData) => {
  try {
    if (!softwareId) {
      throw new Error('Software ID is required');
    }

    const software = SoftwareModel.getSoftwareById(Number(softwareId));
    if (!software) {
      throw new Error('Software not found');
    }

    return SoftwareModel.updateSoftware(Number(softwareId), softwareData);
  } catch (error) {
    throw new Error(`Failed to update software: ${error.message}`);
  }
};

/**
 * Delete software
 */
const deleteSoftware = async (softwareId) => {
  try {
    if (!softwareId) {
      throw new Error('Software ID is required');
    }

    const software = SoftwareModel.getSoftwareById(Number(softwareId));
    if (!software) {
      throw new Error('Software not found');
    }

    return SoftwareModel.deleteSoftware(Number(softwareId));
  } catch (error) {
    throw new Error(`Failed to delete software: ${error.message}`);
  }
};

export default {
  getAllSoftware,
  getSoftwareById,
  createSoftware,
  updateSoftware,
  deleteSoftware,
};

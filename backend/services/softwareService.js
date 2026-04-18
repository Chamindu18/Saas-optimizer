/**
 * Software Service
 * 
 * Contains all business logic related to software/tools.
 * Services abstract the database operations and are used by controllers.
 * 
 * IMPORTANT: All SoftwareModel calls use 'await' because Model functions return Promises.
 * Without await, functions return unresolved Promises instead of actual data.
 * This ensures data flows correctly: Controller → Service (await) → Model (await) → Database
 */

import SoftwareModel from '../models/Software.js';

/**
 * Get all software
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from SoftwareModel
 */
const getAllSoftware = async () => {
  try {
    const softwares = await SoftwareModel.getAllSoftware();
    return softwares;
  } catch (error) {
    throw new Error(`Failed to fetch software: ${error.message}`);
  }
};

/**
 * Get software by ID
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from SoftwareModel
 */
const getSoftwareById = async (softwareId) => {
  try {
    if (!softwareId) {
      throw new Error('Software ID is required');
    }
    const software = await SoftwareModel.getSoftwareById(Number(softwareId));
    return software;
  } catch (error) {
    throw new Error(`Failed to fetch software: ${error.message}`);
  }
};

/**
 * Create new software
 * Validates input and creates a new software record
 * 
 * CRITICAL FIX: Added 'await' to resolve the Promise from SoftwareModel
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

    const newSoftware = await SoftwareModel.createSoftware(softwareData);
    return newSoftware;
  } catch (error) {
    throw new Error(`Failed to create software: ${error.message}`);
  }
};

/**
 * Update software
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from SoftwareModel
 */
const updateSoftware = async (softwareId, softwareData) => {
  try {
    if (!softwareId) {
      throw new Error('Software ID is required');
    }

    // Check if software exists (must await the Promise!)
    const software = await SoftwareModel.getSoftwareById(Number(softwareId));
    if (!software) {
      throw new Error('Software not found');
    }

    const updatedSoftware = await SoftwareModel.updateSoftware(Number(softwareId), softwareData);
    return updatedSoftware;
  } catch (error) {
    throw new Error(`Failed to update software: ${error.message}`);
  }
};

/**
 * Delete software
 * 
 * CRITICAL FIX: Added 'await' to resolve Promises from SoftwareModel
 */
const deleteSoftware = async (softwareId) => {
  try {
    if (!softwareId) {
      throw new Error('Software ID is required');
    }

    // Check if software exists before deleting (must await the Promise!)
    const software = await SoftwareModel.getSoftwareById(Number(softwareId));
    if (!software) {
      throw new Error('Software not found');
    }

    const deletedSoftware = await SoftwareModel.deleteSoftware(Number(softwareId));
    return deletedSoftware;
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

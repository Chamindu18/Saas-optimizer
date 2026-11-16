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
import { validId, httpError } from './licenseRules.js';

const validPrice = (value) => (typeof value === 'string' || typeof value === 'number') &&
  /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(String(value));

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
      throw httpError(400, 'Name, category, and price per seat are required');
    }

    if (!validPrice(softwareData.price_per_seat)) throw httpError(400, 'Price must be a nonnegative monthly amount with at most two decimals');

    const newSoftware = await SoftwareModel.createSoftware(softwareData);
    return newSoftware;
  } catch (error) {
    if (error.status) throw error;
    if (error.code === '23505') throw httpError(409, 'Software name already exists');
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
    if (!validId(softwareId)) throw httpError(400, 'Valid software ID required');
    if (softwareData.price_per_seat !== undefined && !validPrice(softwareData.price_per_seat))
      throw httpError(400, 'Price must be a nonnegative monthly amount with at most two decimals');

    // Check if software exists (must await the Promise!)
    const software = await SoftwareModel.getSoftwareById(Number(softwareId));
    if (!software) {
      throw new Error('Software not found');
    }

    const updatedSoftware = await SoftwareModel.updateSoftware(Number(softwareId), softwareData);
    return updatedSoftware;
  } catch (error) {
    if (error.status) throw error;
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
    if (!validId(softwareId)) throw httpError(400, 'Valid software ID required');

    // Check if software exists before deleting (must await the Promise!)
    const software = await SoftwareModel.getSoftwareById(Number(softwareId));
    if (!software) {
      throw new Error('Software not found');
    }

    const deletedSoftware = await SoftwareModel.deleteSoftware(Number(softwareId));
    return deletedSoftware;
  } catch (error) {
    if (error.code === '23503' || error.code === '23001')
      throw httpError(409, 'Software has license history and cannot be deleted');
    if (error.status) throw error;
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

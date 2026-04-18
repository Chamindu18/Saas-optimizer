/**
 * License Model
 * 
 * Represents a subscription assigned to a user.
 * Queries the PostgreSQL database for all operations.
 * 
 * Fields:
 * - id: Unique identifier (auto-increment from database)
 * - user_id: ID of the user (Foreign Key)
 * - software_id: ID of the software (Foreign Key)
 * - assigned_date: When the license was assigned
 * - last_active_date: When the user last used the software
 * - status: 'active', 'idle', or 'pruned'
 */

import pool from '../config/db.js';

/**
 * BUSINESS LOGIC: Check if a license is idle
 * A license is idle if last_active_date is more than 30 days ago
 * Returns: 'idle' or 'active'
 */
const checkIfIdle = (lastActiveDate) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds
  const lastActiveTime = new Date(lastActiveDate);

  if (lastActiveTime < thirtyDaysAgo) {
    return 'idle';
  }
  return 'active';
};

/**
 * Get all licenses from the database
 * Returns: Array of license objects from PostgreSQL
 */
const getAllLicenses = async () => {
  try {
    const result = await pool.query('SELECT * FROM licenses ORDER BY id ASC');
    return result.rows;
  } catch (error) {
    console.error('Database error in getAllLicenses:', error.message);
    throw error;
  }
};

/**
 * Get a single license by ID from the database
 * Args: id - License ID (number)
 * Returns: License object or null if not found
 */
const getLicenseById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM licenses WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in getLicenseById:', error.message);
    throw error;
  }
};

/**
 * Get licenses by user ID from the database
 * Args: userId - User ID
 * Returns: Array of license objects for that user
 */
const getLicensesByUserId = async (userId) => {
  try {
    const result = await pool.query('SELECT * FROM licenses WHERE user_id = $1 ORDER BY id ASC', [userId]);
    return result.rows;
  } catch (error) {
    console.error('Database error in getLicensesByUserId:', error.message);
    throw error;
  }
};

/**
 * Get licenses by software ID from the database
 * Args: softwareId - Software ID
 * Returns: Array of license objects for that software
 */
const getLicensesBySoftwareId = async (softwareId) => {
  try {
    const result = await pool.query('SELECT * FROM licenses WHERE software_id = $1 ORDER BY id ASC', [softwareId]);
    return result.rows;
  } catch (error) {
    console.error('Database error in getLicensesBySoftwareId:', error.message);
    throw error;
  }
};

/**
 * Create new license in the database
 * Args: licenseData - Object with { user_id, software_id, assigned_date, last_active_date, status }
 * Returns: The newly created license object with ID
 */
const createLicense = async (licenseData) => {
  try {
    const { user_id, software_id, assigned_date, last_active_date, status } = licenseData;
    const result = await pool.query(
      'INSERT INTO licenses (user_id, software_id, assigned_date, last_active_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, software_id, assigned_date, last_active_date, status]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Database error in createLicense:', error.message);
    throw error;
  }
};

/**
 * Update an existing license in the database
 * Args: id - License ID, licenseData - Object with fields to update
 * Returns: The updated license object
 */
const updateLicense = async (id, licenseData) => {
  try {
    const { user_id, software_id, assigned_date, last_active_date, status } = licenseData;
    const result = await pool.query(
      'UPDATE licenses SET user_id=$1, software_id=$2, assigned_date=$3, last_active_date=$4, status=$5 WHERE id=$6 RETURNING *',
      [user_id, software_id, assigned_date, last_active_date, status, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in updateLicense:', error.message);
    throw error;
  }
};

/**
 * Delete a license from the database
 * Args: id - License ID
 * Returns: The deleted license object
 */
const deleteLicense = async (id) => {
  try {
    // First fetch the license to return it
    const selectResult = await pool.query('SELECT * FROM licenses WHERE id = $1', [id]);
    const license = selectResult.rows[0];

    if (!license) {
      return null;
    }

    // Then delete the license
    await pool.query('DELETE FROM licenses WHERE id = $1', [id]);
    
    return license;
  } catch (error) {
    console.error('Database error in deleteLicense:', error.message);
    throw error;
  }
};

export default {
  checkIfIdle,
  getAllLicenses,
  getLicenseById,
  getLicensesByUserId,
  getLicensesBySoftwareId,
  createLicense,
  updateLicense,
  deleteLicense,
};

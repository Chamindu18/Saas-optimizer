/**
 * License Model
 * 
 * Represents a subscription assigned to an employee.
 * Queries the PostgreSQL database for all operations.
 * 
 * Fields:
 * - id: Unique identifier (auto-increment from database)
 * - employee_id: ID of the employee (Foreign Key)
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
    const result = await pool.query(`
      SELECT
        licenses.*,
        employees.name AS "employeeName",
        employees.email AS "employeeEmail",
        software.name AS "softwareName",
        software.category AS "softwareCategory",
        software.price_per_seat AS cost,
        licenses.assigned_date AS "assignedDate",
        licenses.last_active_date AS "lastActivityDate"
      FROM licenses
      JOIN employees ON licenses.employee_id = employees.id
      JOIN software ON licenses.software_id = software.id
      ORDER BY licenses.id ASC
    `);
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
    const result = await pool.query(
      `SELECT
        licenses.*,
        employees.name AS "employeeName",
        employees.email AS "employeeEmail",
        software.name AS "softwareName",
        software.category AS "softwareCategory",
        software.price_per_seat AS cost,
        licenses.assigned_date AS "assignedDate",
        licenses.last_active_date AS "lastActivityDate"
      FROM licenses
      JOIN employees ON licenses.employee_id = employees.id
      JOIN software ON licenses.software_id = software.id
      WHERE licenses.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in getLicenseById:', error.message);
    throw error;
  }
};

/**
 * Get licenses by employee ID from the database
 * Args: employeeId - Employee ID
 * Returns: Array of license objects for that user
 */
const getLicensesByEmployeeId = async (employeeId) => {
  try {
    const result = await pool.query(
      `SELECT
        licenses.*,
        employees.name AS "employeeName",
        employees.email AS "employeeEmail",
        software.name AS "softwareName",
        software.category AS "softwareCategory",
        software.price_per_seat AS cost,
        licenses.assigned_date AS "assignedDate",
        licenses.last_active_date AS "lastActivityDate"
      FROM licenses
      JOIN employees ON licenses.employee_id = employees.id
      JOIN software ON licenses.software_id = software.id
      WHERE licenses.employee_id = $1
      ORDER BY licenses.id ASC`,
      [employeeId]
    );
    return result.rows;
  } catch (error) {
    console.error('Database error in getLicensesByEmployeeId:', error.message);
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
    const result = await pool.query(
      `SELECT
        licenses.*,
        employees.name AS "employeeName",
        employees.email AS "employeeEmail",
        software.name AS "softwareName",
        software.category AS "softwareCategory",
        software.price_per_seat AS cost,
        licenses.assigned_date AS "assignedDate",
        licenses.last_active_date AS "lastActivityDate"
      FROM licenses
      JOIN employees ON licenses.employee_id = employees.id
      JOIN software ON licenses.software_id = software.id
      WHERE licenses.software_id = $1
      ORDER BY licenses.id ASC`,
      [softwareId]
    );
    return result.rows;
  } catch (error) {
    console.error('Database error in getLicensesBySoftwareId:', error.message);
    throw error;
  }
};

/**
 * Create new license in the database
 * Args: licenseData - Object with { employee_id, software_id, assigned_date, last_active_date, status }
 * Returns: The newly created license object with ID
 */
const createLicense = async (licenseData) => {
  try {
    const { employee_id, software_id } = licenseData;
    const assignedDate = licenseData.assigned_date || new Date();
    const lastActiveDate = licenseData.last_active_date || assignedDate;
    const status = licenseData.status || 'active';
    const result = await pool.query(
      'INSERT INTO licenses (employee_id, software_id, assigned_date, last_active_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [employee_id, software_id, assignedDate, lastActiveDate, status]
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
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(licenseData)) {
      if (['employee_id', 'software_id', 'assigned_date', 'last_active_date', 'status'].includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE licenses SET ${fields.join(', ')} WHERE id=$${paramCount} RETURNING *`,
      values
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
  getLicensesByEmployeeId,
  getLicensesBySoftwareId,
  createLicense,
  updateLicense,
  deleteLicense,
};

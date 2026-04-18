/**
 * Software Model
 * 
 * Represents a SaaS tool used by the company.
 * Queries the PostgreSQL database for all operations.
 * 
 * Fields:
 * - id: Unique identifier (auto-increment from database)
 * - name: Software name (e.g., Slack, Zoom, Adobe)
 * - category: Category (e.g., Dev, Design, Marketing)
 * - price_per_seat: Cost per license (monthly or yearly)
 */

import pool from '../config/db.js';

/**
 * Get all software from the database
 * Returns: Array of software objects from PostgreSQL
 */
const getAllSoftware = async () => {
  try {
    const result = await pool.query('SELECT * FROM software ORDER BY id ASC');
    return result.rows;
  } catch (error) {
    console.error('Database error in getAllSoftware:', error.message);
    throw error;
  }
};

/**
 * Get a single software by ID from the database
 * Args: id - Software ID (number)
 * Returns: Software object or null if not found
 */
const getSoftwareById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM software WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in getSoftwareById:', error.message);
    throw error;
  }
};

/**
 * Create new software in the database
 * Args: softwareData - Object with { name, category, price_per_seat }
 * Returns: The newly created software object with ID
 */
const createSoftware = async (softwareData) => {
  try {
    const { name, category, price_per_seat } = softwareData;
    const result = await pool.query(
      'INSERT INTO software (name, category, price_per_seat) VALUES ($1, $2, $3) RETURNING *',
      [name, category, price_per_seat]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Database error in createSoftware:', error.message);
    throw error;
  }
};

/**
 * Update an existing software in the database
 * Args: id - Software ID, softwareData - Object with fields to update
 * Returns: The updated software object
 */
const updateSoftware = async (id, softwareData) => {
  try {
    const { name, category, price_per_seat } = softwareData;
    const result = await pool.query(
      'UPDATE software SET name=$1, category=$2, price_per_seat=$3 WHERE id=$4 RETURNING *',
      [name, category, price_per_seat, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in updateSoftware:', error.message);
    throw error;
  }
};

/**
 * Delete software from the database
 * Args: id - Software ID
 * Returns: The deleted software object
 */
const deleteSoftware = async (id) => {
  try {
    // First fetch the software to return it
    const selectResult = await pool.query('SELECT * FROM software WHERE id = $1', [id]);
    const software = selectResult.rows[0];

    if (!software) {
      return null;
    }

    // Then delete the software
    await pool.query('DELETE FROM software WHERE id = $1', [id]);
    
    return software;
  } catch (error) {
    console.error('Database error in deleteSoftware:', error.message);
    throw error;
  }
};

export default {
  getAllSoftware,
  getSoftwareById,
  createSoftware,
  updateSoftware,
  deleteSoftware,
};

/**
 * User Model
 * 
 * Represents an employee in the company.
 * Queries the PostgreSQL database for all operations.
 * 
 * Fields:
 * - id: Unique identifier (auto-increment from database)
 * - name: Employee name
 * - email: Employee email
 * - created_at: Timestamp when user was created (auto-set by database)
 */

import pool from '../config/db.js';

/**
 * Get all users from the database
 * Returns: Array of user objects from PostgreSQL
 */
const getAllUsers = async () => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id ASC');
    return result.rows;
  } catch (error) {
    console.error('Database error in getAllUsers:', error.message);
    throw error;
  }
};

/**
 * Get a single user by ID from the database
 * Args: id - User ID (number)
 * Returns: User object or null if not found
 */
const getUserById = async (id) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in getUserById:', error.message);
    throw error;
  }
};

/**
 * Create a new user in the database
 * Args: userData - Object with { name, email }
 * Returns: The newly created user object with ID and created_at
 */
const createUser = async (userData) => {
  try {
    const { name, email } = userData;
    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Database error in createUser:', error.message);
    throw error;
  }
};

/**
 * Update an existing user in the database
 * Args: id - User ID, userData - Object with fields to update
 * Returns: The updated user object
 */
const updateUser = async (id, userData) => {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Dynamically build the UPDATE query based on provided fields
    for (const [key, value] of Object.entries(userData)) {
      if (key !== 'id' && key !== 'created_at') { // Don't allow updating ID or created_at
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    // If no fields to update, return null
    if (fields.length === 0) {
      return null;
    }

    // Add the ID parameter
    values.push(id);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Database error in updateUser:', error.message);
    throw error;
  }
};

/**
 * Delete a user from the database
 * Args: id - User ID
 * Returns: The deleted user object
 */
const deleteUser = async (id) => {
  try {
    // First fetch the user to return it
    const selectResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = selectResult.rows[0];

    if (!user) {
      return null;
    }

    // Then delete the user
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    return user;
  } catch (error) {
    console.error('Database error in deleteUser:', error.message);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

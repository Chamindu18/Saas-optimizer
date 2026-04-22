/**
 * User Service
 * 
 * Contains all business logic related to users.
 * Services abstract the database operations and are used by controllers.
 * This keeps controllers lean and focused on HTTP request/response handling.
 */

import UserModel from '../models/User.js';

/**
 * Get all users
 * Returns a list of all users in the system
 */
const getAllUsers = async () => {
  try {
    return await UserModel.getAllUsers();
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

/**
 * Get user by ID
 * Returns a single user by their ID
 */
const getUserById = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return await UserModel.getUserById(Number(userId));
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

/**
 * Create a new user
 * Validates input and creates a new user record
 */
const createUser = async (userData) => {
  try {
    // Validation
    if (!userData.name || !userData.email) {
      throw new Error('Name and email are required');
    }

    if (!userData.email.includes('@')) {
      throw new Error('Invalid email format');
    }

    return await UserModel.createUser(userData);
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

/**
 * Update a user
 * Updates user information
 */
const updateUser = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await UserModel.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    return await UserModel.updateUser(Number(userId), userData);
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

/**
 * Delete a user
 * Removes a user from the system
 */
const deleteUser = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await UserModel.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    return await UserModel.deleteUser(Number(userId));
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

/**
 * Count users with admin role
 * Returns the number of admin users in the system
 */
const countAdmins = async () => {
  try {
    return await UserModel.countAdmins();
  } catch (error) {
    throw new Error(`Failed to count admins: ${error.message}`);
  }
};

/**
 * Update a user's role
 * Changes a user's role to admin, manager, or viewer
 */
const updateUserRole = async (userId, newRole) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!['admin', 'manager', 'viewer'].includes(newRole)) {
      throw new Error('Invalid role. Must be one of: admin, manager, viewer');
    }

    const user = await UserModel.getUserById(Number(userId));
    if (!user) {
      throw new Error('User not found');
    }

    return await UserModel.updateUserRole(Number(userId), newRole);
  } catch (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  countAdmins,
  updateUserRole,
};

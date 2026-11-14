/**
 * User Service
 * 
 * Contains all business logic related to users.
 * Services abstract the database operations and are used by controllers.
 * This keeps controllers lean and focused on HTTP request/response handling.
 */

import UserModel from '../models/User.js';
import bcrypt from 'bcryptjs';

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
  const { name, email, password } = userData;
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    const error = new Error('Valid name, email, and password of at least 8 characters are required');
    error.status = 400;
    throw error;
  }
  const hash = await bcrypt.hash(password, 10);
  return UserModel.createUser({ name: name.trim(), email: email.trim(), password: hash });
};

/**
 * Update a user
 * Updates user information
 */
const updateUser = async (userId, userData) => {
  const { name, email } = userData;
  if ((name === undefined && email === undefined) ||
      (name !== undefined && (typeof name !== 'string' || !name.trim())) ||
      (email !== undefined && (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
    const error = new Error('Provide a valid name or email');
    error.status = 400;
    throw error;
  }
  const updated = await UserModel.updateUser(Number(userId), {
    name: name?.trim(), email: email?.trim(),
  });
  if (!updated) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }
  return updated;
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
};

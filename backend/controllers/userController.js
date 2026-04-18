/**
 * User Controller
 * 
 * Controllers handle HTTP requests and responses.
 * They call services to perform business logic, then format and return the response.
 * Controllers should be thin and avoid complex business logic.
 */

import userService from '../services/userService.js';

/**
 * GET /api/users
 * Get all users
 */
const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * POST /api/users
 * Create a new user
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com"
 * }
 */
const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    const newUser = await userService.createUser({
      name,
      email,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * PUT /api/users/:id
 * Update a user
 * 
 * Request body (partial):
 * {
 *   "name": "Jane Doe",
 *   "email": "jane@example.com"
 * }
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const updatedUser = await userService.updateUser(id, {
      name,
      email,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedUser = await userService.deleteUser(id);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

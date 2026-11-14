/**
 * User Controller
 * 
 * Controllers handle HTTP requests and responses.
 * They call services to perform business logic, then format and return the response.
 * Controllers should be thin and avoid complex business logic.
 */

import userService from '../services/userService.js';
import { changeUserRole, deleteAccount } from '../services/accountMutations.js';
import logAction from '../utils/auditLogger.js';
import respondError from '../utils/respondError.js';

const validId = (value) => Number.isSafeInteger(Number(value)) && Number(value) > 0;
const canRead = (actor, id) => actor.role === 'admin' || Number(actor.id) === Number(id);
const canEdit = (actor, id) => actor.role === 'admin' || Number(actor.id) === Number(id);

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
    respondError(res, error);
  }
};

/**
 * GET /api/users/:id
 * Get a single user by ID
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validId(id)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (!canRead(req.user, id)) return res.status(403).json({ success: false, error: 'Access denied' });
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
    respondError(res, error);
  }
};

/**
 * POST /api/users
 * Create a new user
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "a user-chosen password"
 * }
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = await userService.createUser({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser,
    });
  } catch (error) {
    respondError(res, error);
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
    if (!validId(id)) return res.status(400).json({ success: false, error: 'Invalid user ID' });
    if (!canEdit(req.user, id)) return res.status(403).json({ success: false, error: 'Access denied' });
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
    respondError(res, error);
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { target, result: deletedUser } = await deleteAccount(id, req.user.id);
    await logAction({ userId: req.user.id, userName: req.user.email, userRole: req.user.role,
      action: 'DELETE_USER', targetType: 'user', targetId: target.id, targetName: target.email,
      details: `Deleted ${target.role} account`, ipAddress: req.ip });

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    respondError(res, error);
  }
};

/**
 * PATCH /api/users/:id/role
 * Update a user's role (admin only)
 * 
 * Prevents:
 * - Users from changing their own role
 * - Demoting the last admin account
 * 
 * Request body:
 * {
 *   "role": "manager"  // 'admin', 'manager', or 'viewer'
 * }
 */
const updateUserRole = async (req, res) => {
  try {
    const { target, result: updatedUser } = await changeUserRole(req.params.id, req.user.id, req.body.role);
    await logAction({ userId: req.user.id, userName: req.user.email, userRole: req.user.role,
      action: 'ROLE_CHANGE', targetType: 'user', targetId: target.id, targetName: target.email,
      details: `Changed role from ${target.role} to ${updatedUser.role}`, ipAddress: req.ip });

    res.json({
      success: true,
      message: `User role updated to ${updatedUser.role}`,
      data: updatedUser,
    });
  } catch (error) {
    respondError(res, error);
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
};

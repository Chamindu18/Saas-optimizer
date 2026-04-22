/**
 * User Routes
 * 
 * Defines all HTTP endpoints for user operations.
 * Maps URLs to controller functions.
 * 
 * Endpoints:
 * GET    /api/users          - Get all users
 * GET    /api/users/:id      - Get user by ID
 * POST   /api/users          - Create new user
 * PUT    /api/users/:id      - Update user
 * DELETE /api/users/:id      - Delete user
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import userController from '../controllers/userController.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Get all users - admin only (for role management)
router.get('/', requireRole('admin'), userController.getUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Update a user's role - admin only
router.patch('/:id/role', requireRole('admin'), userController.updateUserRole);

export default router;

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
import userController from '../controllers/userController.js';

const router = express.Router();

// Get all users
router.get('/', userController.getUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Create new user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

export default router;

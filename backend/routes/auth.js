/**
 * Authentication Routes
 * 
 * Public authentication endpoints. Account provisioning is administrator controlled.
 * 
 * Endpoints:
 * POST /api/auth/register  - Public registration disabled (403)
 * POST /api/auth/login     - Login and get JWT token
 */

import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Keep the route for existing clients; it always denies public registration.
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);

export default router;

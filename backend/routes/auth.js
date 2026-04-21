/**
 * Authentication Routes
 * 
 * Public endpoints for user registration and login
 * 
 * Endpoints:
 * POST /api/auth/register  - Create new user account
 * POST /api/auth/login     - Login and get JWT token
 */

import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', authController.register);

// POST /api/auth/login - Login user
router.post('/login', authController.login);

export default router;

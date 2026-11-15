/**
 * Stats Routes
 *
 * Organizational summary counts require an authenticated account.
 */

import express from 'express';
import statsController from '../controllers/statsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/stats/home - Authenticated workspace summary counts
router.get('/home', authMiddleware, statsController.getHomeStats);

export default router;

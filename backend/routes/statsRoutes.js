/**
 * Stats Routes
 *
 * Public stats endpoints for the marketing site.
 */

import express from 'express';
import statsController from '../controllers/statsController.js';

const router = express.Router();

// GET /api/stats/home - Public homepage stats
router.get('/home', statsController.getHomeStats);

export default router;

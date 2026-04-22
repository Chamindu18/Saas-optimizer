/**
 * Dashboard Routes
 * 
 * Defines all HTTP endpoints for dashboard analytics.
 * Maps URLs to controller functions.
 * 
 * Endpoints:
 * GET /api/dashboard          - Get complete dashboard analytics
 * GET /api/dashboard/summary  - Get license summary
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Get complete dashboard data (metrics, calculations, idle users) - all authenticated roles can view
router.get('/', dashboardController.getDashboardData);

// Get quick license summary (counts by status) - all authenticated roles can view
router.get('/summary', dashboardController.getLicenseSummary);

// All unauthenticated requests are blocked by the auth middleware above

export default router;

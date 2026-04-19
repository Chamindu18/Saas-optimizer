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
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Get complete dashboard data (metrics, calculations, idle users)
router.get('/', dashboardController.getDashboardData);

// Get quick license summary (counts by status)
router.get('/summary', dashboardController.getLicenseSummary);

export default router;

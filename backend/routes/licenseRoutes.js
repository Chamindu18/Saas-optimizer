/**
 * License Routes
 * 
 * Defines all HTTP endpoints for license operations.
 * Maps URLs to controller functions.
 * 
 * Endpoints:
 * GET    /api/licenses                    - Get all licenses
 * GET    /api/licenses/:id                - Get license by ID
 * POST   /api/licenses                    - Assign license to employee
 * PUT    /api/licenses/:id                - Update license
 * DELETE /api/licenses/:id                - Retained history; returns 409
 * POST   /api/licenses/:id/prune          - Prune (disable) license
 * GET    /api/licenses/dashboard/metrics  - Get dashboard metrics
 * GET    /api/licenses/idle/list          - Get all idle licenses
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import licenseController from '../controllers/licenseController.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Dashboard metrics (must be before :id routes to avoid confusion) - all authenticated roles can view
router.get('/dashboard/metrics', licenseController.getDashboardData);

// Idle licenses list - all authenticated roles can view
router.get('/idle/list', licenseController.getIdleLicenses);

// Get all licenses - all authenticated roles can view
router.get('/', licenseController.getLicenses);

// Get license by ID - all authenticated roles can view
router.get('/:id', licenseController.getLicenseById);

// Assign license to user - admin and manager only
router.post('/', requireRole('admin', 'manager'), licenseController.assignLicense);

// Update license - admin and manager only
router.put('/:id', requireRole('admin', 'manager'), licenseController.updateLicense);

// Prune license - admin only (special destructive action)
router.post('/:id/prune', requireRole('admin'), licenseController.pruneLicense);

// Historical assignments cannot be deleted; authenticated admins receive 409.
router.delete('/:id', requireRole('admin'), licenseController.deleteLicense);

export default router;

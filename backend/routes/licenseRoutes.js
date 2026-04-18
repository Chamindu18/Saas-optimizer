/**
 * License Routes
 * 
 * Defines all HTTP endpoints for license operations.
 * Maps URLs to controller functions.
 * 
 * Endpoints:
 * GET    /api/licenses                    - Get all licenses
 * GET    /api/licenses/:id                - Get license by ID
 * POST   /api/licenses                    - Assign license to user
 * PUT    /api/licenses/:id                - Update license
 * DELETE /api/licenses/:id                - Delete license
 * POST   /api/licenses/:id/prune          - Prune (disable) license
 * GET    /api/licenses/dashboard/metrics  - Get dashboard metrics
 * GET    /api/licenses/idle/list          - Get all idle licenses
 */

import express from 'express';
import licenseController from '../controllers/licenseController.js';

const router = express.Router();

// Dashboard metrics (must be before :id routes to avoid confusion)
router.get('/dashboard/metrics', licenseController.getDashboardData);

// Idle licenses list
router.get('/idle/list', licenseController.getIdleLicenses);

// Get all licenses
router.get('/', licenseController.getLicenses);

// Get license by ID
router.get('/:id', licenseController.getLicenseById);

// Assign license to user
router.post('/', licenseController.assignLicense);

// Update license
router.put('/:id', licenseController.updateLicense);

// Prune license
router.post('/:id/prune', licenseController.pruneLicense);

// Delete license
router.delete('/:id', licenseController.deleteLicense);

export default router;

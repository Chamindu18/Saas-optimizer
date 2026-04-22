/**
 * Software Routes
 * 
 * Defines all HTTP endpoints for software operations.
 * Maps URLs to controller functions.
 * 
 * Endpoints:
 * GET    /api/software       - Get all software
 * GET    /api/software/:id   - Get software by ID
 * POST   /api/software       - Create new software
 * PUT    /api/software/:id   - Update software
 * DELETE /api/software/:id   - Delete software
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import softwareController from '../controllers/softwareController.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Get all software - all authenticated roles can view
router.get('/', softwareController.getSoftware);

// Get software by ID - all authenticated roles can view
router.get('/:id', softwareController.getSoftwareById);

// Create new software - admin and manager only
router.post('/', requireRole('admin', 'manager'), softwareController.createSoftware);

// Update software - admin and manager only
router.put('/:id', requireRole('admin', 'manager'), softwareController.updateSoftware);

// Delete software - admin only
router.delete('/:id', requireRole('admin'), softwareController.deleteSoftware);

export default router;

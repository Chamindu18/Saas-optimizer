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
import softwareController from '../controllers/softwareController.js';

const router = express.Router();

// Apply auth middleware to all routes in this router
router.use(authMiddleware);

// Get all software
router.get('/', softwareController.getSoftware);

// Get software by ID
router.get('/:id', softwareController.getSoftwareById);

// Create new software
router.post('/', softwareController.createSoftware);

// Update software
router.put('/:id', softwareController.updateSoftware);

// Delete software
router.delete('/:id', softwareController.deleteSoftware);

export default router;

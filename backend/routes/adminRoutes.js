/**
 * Admin Routes
 * 
 * All routes in this file are protected by:
 * 1. authMiddleware - requires valid JWT
 * 2. requireRole('admin') - requires admin role
 * 
 * Endpoints:
 * GET    /api/admin/stats          - Admin dashboard metrics
 * GET    /api/admin/users          - List all users
 * PATCH  /api/admin/users/:id/role - Change user role
 * DELETE /api/admin/users/:id      - Delete user account
 * GET    /api/admin/audit-logs     - Audit log timeline
 * GET    /api/admin/system-health  - System health status
 */

import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import adminController from '../controllers/adminController.js';

const router = express.Router();

// Apply auth middleware to all admin routes
// Requires valid JWT token
router.use(authMiddleware);

// Apply admin-only role check to all admin routes
// User must have 'admin' role
router.use(requireRole('admin'));

// GET /api/admin/stats - Admin dashboard metrics
router.get('/stats', adminController.getAdminStats);

// GET /api/admin/users - List all users
router.get('/users', adminController.getAllUsers);

// PATCH /api/admin/users/:id/role - Change user role
router.patch('/users/:id/role', adminController.changeUserRole);

// DELETE /api/admin/users/:id - Delete user account
router.delete('/users/:id', adminController.deleteUser);

// GET /api/admin/audit-logs - Audit log timeline
router.get('/audit-logs', adminController.getAuditLogs);

// GET /api/admin/system-health - System health status
router.get('/system-health', adminController.getSystemHealth);

export default router;

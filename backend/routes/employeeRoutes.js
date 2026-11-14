import express from 'express';
import authMiddleware from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import * as controller from '../controllers/employeeController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', requireRole('admin', 'manager'), controller.create);
router.put('/:id', requireRole('admin', 'manager'), controller.update);
router.delete('/:id', requireRole('admin', 'manager'), controller.remove);
export default router;

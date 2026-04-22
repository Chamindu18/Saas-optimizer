/**
 * Role-Based Access Control Middleware
 * 
 * Checks if the authenticated user has one of the allowed roles
 * Must be used AFTER authMiddleware
 * 
 * Usage:
 *   router.delete('/:id', authMiddleware, requireRole('admin'), deleteController);
 *   router.post('/', authMiddleware, requireRole('admin', 'manager'), createController);
 */

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated (authMiddleware should have set req.user)
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'You must be logged in to perform this action'
      });
    }

    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`,
        yourRole: req.user.role
      });
    }

    // User has correct role, proceed to next handler
    next();
  };
};

export default requireRole;

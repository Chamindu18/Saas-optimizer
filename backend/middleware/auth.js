/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header
 * If valid, attaches user ID to req.user
 * If invalid or missing, returns 401 Unauthorized
 */

import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes that require authentication
 * Checks for valid JWT token in Authorization header
 * 
 * Expected header: Authorization: Bearer <token>
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if header exists and follows "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid Authorization header',
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.slice(7); // Remove "Bearer " prefix

    // Verify token with secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-env');

    // Attach user data to request object for use in controllers
    // Includes userId, email, and role for permission checks
    req.user = { id: decoded.userId, email: decoded.email, role: decoded.role };

    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Token is invalid, expired, or couldn't be verified
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      details: error.message,
    });
  }
};

export default authMiddleware;

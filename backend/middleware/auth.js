/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header
 * If valid, attaches user ID to req.user
 * If invalid or missing, returns 401 Unauthorized
 */

import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
};

/**
 * Middleware to protect routes that require authentication
 * Checks for valid JWT token in Authorization header
 * 
 * Expected header: Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header' });
  }

  let decoded;
  try {
    decoded = jwt.verify(authHeader.slice(7), getJwtSecret(), { algorithms: ['HS256'] });
  } catch (error) {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ success: false, error: 'Authentication unavailable' });
    }
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  if (!Number.isSafeInteger(Number(decoded.userId)) || Number(decoded.userId) < 1) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
  try {
    const result = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows[0]) {
      return res.status(401).json({ success: false, error: 'Account no longer exists' });
    }
    req.user = result.rows[0];
    return next();
  } catch (error) {
    console.error('Authentication lookup failed:', error.message);
    return res.status(500).json({ success: false, error: 'Authentication unavailable' });
  }
};

export default authMiddleware;

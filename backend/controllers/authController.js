/**
 * Authentication Controller
 * 
 * Handles user registration and login
 * - register: Creates new user with hashed password
 * - login: Verifies credentials and returns JWT token
 */

import bcrypt from 'bcryptjs';
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
 * POST /api/auth/register
 * Create a new user account
 * 
 * Request body:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response on success (201):
 * {
 *   "success": true,
 *   "message": "User registered successfully",
 *   "userId": 1
 * }
 */
const register = async (req, res) => {
  try {
    const jwtSecret = getJwtSecret();
    // Accept 'fullName' from frontend, map to 'name' in DB
    const { name: fullName, email, password } = req.body;
    const name = fullName || '';  // Fallback if sent as 'name' from old code

    // Validation
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered',
      });
    }

    // Hash password with bcryptjs
    // salt rounds: 10 (balance between security and performance)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into database with default role 'viewer'
    // Never allow role to be passed in request body for security
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, email, hashedPassword, 'viewer']
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: newUser.id,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 * 
 * Request body:
 * {
 *   "email": "john@example.com",
 *   "password": "securePassword123"
 * }
 * 
 * Response on success (200):
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "token": "eyJhbGc...",
 *   "user": {
 *     "id": 1,
 *     "name": "John Doe",
 *     "email": "john@example.com"
 *   }
 * }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (typeof email !== 'string' || !email || typeof password !== 'string' || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user by email and fetch role
    const result = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Compare provided password with stored hash
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // Check if password matches
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token with role included for frontend permission checks
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' } // Token valid for 7 days
    );

    // Return token (DO NOT return password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
};

const me = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (!rows[0]) return res.status(401).json({ success: false, error: 'Account no longer exists' });
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to load account' });
  }
};

export default {
  register,
  login,
  me,
};

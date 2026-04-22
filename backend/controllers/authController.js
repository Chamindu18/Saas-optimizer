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
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
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
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'viewer']
    );

    const newUser = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      userId: newUser.id,
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message,
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
    if (!email || !password) {
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
      process.env.JWT_SECRET || 'your-secret-key-change-in-env',
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
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message,
    });
  }
};

export default {
  register,
  login,
};

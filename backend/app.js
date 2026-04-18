/**
 * Express Application Setup
 * 
 * This file configures the Express app with:
 * - Middleware (CORS, JSON parsing)
 * - Database connection testing
 * - Routes for all modules
 * - Error handling
 */

// ============================================
// IMPORTS
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import softwareRoutes from './routes/softwareRoutes.js';
import licenseRoutes from './routes/licenseRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ============================================
// DATABASE CONNECTION TEST
// ============================================

/**
 * Test the PostgreSQL database connection
 * Runs a simple SELECT NOW() query when the app starts
 * Logs success or error message to console
 */
(async () => {
  try {
    // Execute test query to verify database connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ DB Connected - PostgreSQL connection successful');
    console.log('   Server timestamp from database:', result.rows[0].now);
  } catch (error) {
    console.error('❌ DB Error - PostgreSQL connection failed');
    console.error('   Error details:', error.message);
    console.error('   Check your DATABASE_URL in .env file');
  }
})();

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS (allows requests from frontend)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// ============================================
// BASIC ROUTE
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SaaS Management Platform API',
    version: '1.0.0',
    documentation: 'Available endpoints: /api/users, /api/software, /api/licenses',
  });
});

// ============================================
// API ROUTES
// ============================================

// User routes: /api/users
app.use('/api/users', userRoutes);

// Software routes: /api/software
app.use('/api/software', softwareRoutes);

// License routes: /api/licenses
app.use('/api/licenses', licenseRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `${req.method} ${req.path} does not exist`,
  });
});

// Global error handler (if any error is thrown in routes/services)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// ============================================
// EXPORT APP
// ============================================

export default app;

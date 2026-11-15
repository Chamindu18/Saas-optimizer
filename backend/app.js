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
import { isIP } from 'node:net';
import pool from './config/db.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/userRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import softwareRoutes from './routes/softwareRoutes.js';
import licenseRoutes from './routes/licenseRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Trust only explicitly named proxy IPs/CIDRs. Never trust arbitrary forwarding headers.
const trustedProxies = process.env.TRUSTED_PROXY_CIDRS === undefined || process.env.TRUSTED_PROXY_CIDRS === ''
  ? [] : process.env.TRUSTED_PROXY_CIDRS.split(',').map((value) => value.trim());
for (const proxy of trustedProxies) {
  const [address, prefix, extra] = proxy.split('/');
  const family = isIP(address);
  if (!family || extra !== undefined || (prefix !== undefined &&
      (!/^\d+$/.test(prefix) || Number(prefix) === 0 || Number(prefix) > (family === 4 ? 32 : 128)))) {
    throw new Error('TRUSTED_PROXY_CIDRS must contain only IP addresses or CIDR ranges');
  }
}
if (trustedProxies.length) app.set('trust proxy', trustedProxies);

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
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
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
    documentation: 'Available endpoints: /api/users, /api/software, /api/licenses, /api/dashboard',
  });
});

// ============================================
// API ROUTES
// ============================================

// Auth routes: /api/auth (public - no authentication required)
app.use('/api/auth', authRoutes);

// User routes: /api/users
app.use('/api/users', userRoutes);
app.use('/api/employees', employeeRoutes);

// Software routes: /api/software
app.use('/api/software', softwareRoutes);

// License routes: /api/licenses
app.use('/api/licenses', licenseRoutes);

// Dashboard routes: /api/dashboard
app.use('/api/dashboard', dashboardRoutes);

// Stats routes: /api/stats (authenticated organizational counts)
app.use('/api/stats', statsRoutes);

// Admin routes: /api/admin (admin only)
app.use('/api/admin', adminRoutes);

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
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : (err.message || 'Request failed'),
    status,
  });
});

// ============================================
// EXPORT APP
// ============================================

export default app;

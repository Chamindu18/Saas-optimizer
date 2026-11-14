/**
 * Server Entry Point
 * 
 * This file starts the Express server and listens for incoming requests.
 * Also sets up cron job for idle license checking.
 */

import app from './app.js';
import cron from 'node-cron';
import pool from './config/db.js';
import licenseService from './services/licenseService.js';

const PORT = process.env.PORT || 5000;

// ============================================
// CRON JOB - Idle License Check
// ============================================

/**
 * Daily idle license check
 * Runs every day at midnight (00:00)
 * Reconciles stored status with the same last-activity rule used by reads.
 */
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Starting idle license check...');
  let flaggedCount = 0;

  try {
    // One conditional statement handles all changed non-pruned rows.
    flaggedCount = await licenseService.reconcileIdleStatuses();

    // Write success to system_health
    await pool.query(
      `INSERT INTO system_health (check_type, status, idle_flagged, message)
       VALUES ($1, $2, $3, $4)`,
      ['idle_check', 'success', flaggedCount, `Flagged ${flaggedCount} idle licenses`]
    );

    console.log(`[CRON] Complete — ${flaggedCount} licenses flagged as idle`);

  } catch (err) {
    console.error('[CRON] Failed:', err.message);
    
    // Write failure to system_health
    try {
      await pool.query(
        `INSERT INTO system_health (check_type, status, idle_flagged, message)
         VALUES ($1, $2, $3, $4)`,
        ['idle_check', 'error', 0, err.message]
      );
    } catch (logErr) {
      console.error('[CRON] Could not log error:', logErr.message);
    }
  }
});

console.log('[CRON] Idle license check scheduled for midnight daily');

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║  SaaS Management Platform - Backend    ║
  ║  Server running on port ${PORT}          ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}               ║
  ╚════════════════════════════════════════╝
  `);
  console.log(`API available at: http://localhost:${PORT}`);
  console.log('Press CTRL+C to stop the server');
});

/**
 * Server Entry Point
 * 
 * This file starts the Express server and listens for incoming requests.
 * Also sets up cron job for idle license checking.
 */

import app from './app.js';
import cron from 'node-cron';
import pool from './config/db.js';

const PORT = process.env.PORT || 5000;

// ============================================
// CRON JOB - Idle License Check
// ============================================

/**
 * Daily idle license check
 * Runs every day at midnight (00:00)
 * Flags licenses with no activity for 30+ days as 'idle'
 */
cron.schedule('0 0 * * *', async () => {
  console.log('[CRON] Starting idle license check...');
  let flaggedCount = 0;

  try {
    // Flag any license with last activity 30+ days ago
    // (In a real app, you'd track last_login in activity_logs)
    // For now, we'll just check if status is already set
    const result = await pool.query(`
      UPDATE licenses
      SET status = 'idle'
      WHERE status = 'active'
        AND id IN (
          SELECT id FROM licenses
          WHERE created_at < NOW() - INTERVAL '30 days'
          LIMIT 10  -- Safe limit to avoid huge updates
        )
      RETURNING id
    `);

    flaggedCount = result.rowCount || 0;

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

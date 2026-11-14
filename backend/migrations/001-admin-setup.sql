-- ============================================
-- SEATWATCH ADMIN SYSTEM DATABASE SETUP
-- ============================================
-- Run this script in your PostgreSQL client
-- This creates the necessary tables and indexes for admin functionality

-- Step 1: Ensure role column exists with correct default
-- ============================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'viewer';

-- Step 1a: Add updated_at column to licenses table for tracking modifications
-- ============================================
ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Step 3: Verify the data looks correct
-- ============================================
-- SELECT id, name, email, role, created_at FROM users ORDER BY created_at;

-- Step 4: Create audit_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  user_name   VARCHAR(100),
  user_role   VARCHAR(20),
  action      VARCHAR(50)  NOT NULL,
  target_type VARCHAR(50),
  target_id   BIGINT,
  target_name VARCHAR(100),
  details     TEXT,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Step 5: Create indexes for fast queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_created
  ON audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user
  ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON audit_logs(action);

-- Step 6: Create system_health table for cron job tracking
-- ============================================
CREATE TABLE IF NOT EXISTS system_health (
  id           BIGSERIAL PRIMARY KEY,
  check_type   VARCHAR(50) NOT NULL,
  status       VARCHAR(20) NOT NULL,
  idle_flagged INTEGER DEFAULT 0,
  message      TEXT,
  ran_at       TIMESTAMP DEFAULT NOW()
);

-- Step 7: Create index on system_health for latest status lookup
-- ============================================
CREATE INDEX IF NOT EXISTS idx_system_health_check_type_ran
  ON system_health(check_type, ran_at DESC);

-- ============================================
-- VERIFICATION QUERIES (uncomment to run)
-- ============================================
-- Verify users table has role column:
-- SELECT id, name, email, role, created_at FROM users ORDER BY created_at;

-- Verify admin user is set:
-- SELECT * FROM users WHERE role = 'admin';

-- Verify audit_logs table exists:
-- SELECT * FROM audit_logs LIMIT 1;

-- Verify system_health table exists:
-- SELECT * FROM system_health LIMIT 1;

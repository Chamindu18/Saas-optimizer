-- ============================================
-- CORE SaaS MANAGEMENT SCHEMA
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20)  NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS software (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(120) NOT NULL UNIQUE,
  category        VARCHAR(80)  NOT NULL,
  price_per_seat   NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price_per_seat >= 0),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_software_category ON software(category);

CREATE TABLE IF NOT EXISTS licenses (
  id                BIGSERIAL PRIMARY KEY,
  user_id           BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  software_id       BIGINT NOT NULL REFERENCES software(id) ON DELETE CASCADE,
  assigned_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_date  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'pruned')),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_licenses_user_software UNIQUE (user_id, software_id)
);

CREATE INDEX IF NOT EXISTS idx_licenses_user_id ON licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_software_id ON licenses(software_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_last_active_date ON licenses(last_active_date);

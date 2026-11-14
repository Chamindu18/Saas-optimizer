// One-time local bootstrap. Credentials are supplied by the operator and never logged.
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const { ADMIN_BOOTSTRAP_NAME: name, ADMIN_BOOTSTRAP_EMAIL: email,
  ADMIN_BOOTSTRAP_PASSWORD: password } = process.env;

try {
  if (!name?.trim() || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !password || password.length < 12) {
    throw new Error('Set ADMIN_BOOTSTRAP_NAME, ADMIN_BOOTSTRAP_EMAIL, and a password of at least 12 characters');
  }
  const existingAdmin = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (existingAdmin.rowCount) throw new Error('An admin account already exists');
  const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email.trim()]);
  if (existingEmail.rowCount) throw new Error('Email is already registered; refusing to promote an existing account');
  const hash = await bcrypt.hash(password, 12);
  await pool.query(`INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, 'admin')`, [name.trim(), email.trim(), hash]);
  console.log('Admin account created');
} catch (error) {
  console.error('Admin bootstrap failed:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}

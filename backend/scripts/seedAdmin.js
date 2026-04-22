/**
 * Seed Admin User Script
 * 
 * Run this script to add an admin user to the database
 * Usage: node backend/scripts/seedAdmin.js
 */

import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

async function seedAdmin() {
  try {
    console.log('🌱 Adding admin user...');

    const name = 'admin';
    const email = 'admin@example.com';
    const password = 'admin123';
    const role = 'admin';

    // Check if user already exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length > 0) {
      console.log('✅ Admin user already exists with email:', email);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, role]
    );

    const user = result.rows[0];
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email:', user.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Role:', user.role);
    console.log('');
    console.log('You can now login with these credentials.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

seedAdmin();

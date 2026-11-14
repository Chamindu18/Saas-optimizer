import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const users = [
  { name: 'Admin User', email: 'admin@company.com', password: 'demo123', role: 'admin' },
  { name: 'Finance Lead', email: 'finance@company.com', password: 'demo123', role: 'manager' },
  { name: 'Operations Lead', email: 'ops@company.com', password: 'demo123', role: 'manager' },
  { name: 'Alex Morgan', email: 'alex.morgan@company.com', password: 'demo123', role: 'viewer' },
  { name: 'Priya Chen', email: 'priya.chen@company.com', password: 'demo123', role: 'viewer' },
];

const software = [
  { name: 'Slack', category: 'Communication', price_per_seat: 8.0 },
  { name: 'Zoom', category: 'Communication', price_per_seat: 15.0 },
  { name: 'Figma', category: 'Design', price_per_seat: 12.0 },
  { name: 'GitHub', category: 'Engineering', price_per_seat: 21.0 },
  { name: 'Notion', category: 'Productivity', price_per_seat: 10.0 },
  { name: 'Linear', category: 'Productivity', price_per_seat: 9.0 },
];

const daysAgo = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const seedDemoData = async () => {
  try {
    const hashedPasswords = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    for (const user of hashedPasswords) {
      await pool.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email)
         DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, role = EXCLUDED.role`,
        [user.name, user.email, user.password, user.role]
      );
    }

    for (const item of software) {
      await pool.query(
        `INSERT INTO software (name, category, price_per_seat)
         VALUES ($1, $2, $3)
         ON CONFLICT (name)
         DO UPDATE SET category = EXCLUDED.category, price_per_seat = EXCLUDED.price_per_seat, updated_at = NOW()`,
        [item.name, item.category, item.price_per_seat]
      );
    }

    const userLookup = await pool.query('SELECT id, email FROM users');
    const softwareLookup = await pool.query('SELECT id, name FROM software');

    const userIds = Object.fromEntries(userLookup.rows.map((row) => [row.email, row.id]));
    const softwareIds = Object.fromEntries(softwareLookup.rows.map((row) => [row.name, row.id]));

    const licenses = [
      { user_id: userIds['admin@company.com'], software_id: softwareIds.Slack, status: 'active', last_active_date: daysAgo(2) },
      { user_id: userIds['finance@company.com'], software_id: softwareIds.Zoom, status: 'idle', last_active_date: daysAgo(41) },
      { user_id: userIds['ops@company.com'], software_id: softwareIds.Linear, status: 'active', last_active_date: daysAgo(5) },
      { user_id: userIds['alex.morgan@company.com'], software_id: softwareIds.Figma, status: 'idle', last_active_date: daysAgo(33) },
      { user_id: userIds['priya.chen@company.com'], software_id: softwareIds.Notion, status: 'active', last_active_date: daysAgo(1) },
      { user_id: userIds['admin@company.com'], software_id: softwareIds.GitHub, status: 'pruned', last_active_date: daysAgo(90) },
    ];

    for (const license of licenses) {
      await pool.query(
        `INSERT INTO licenses (user_id, software_id, assigned_date, last_active_date, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, software_id)
         DO UPDATE SET last_active_date = EXCLUDED.last_active_date, status = EXCLUDED.status, updated_at = NOW()`,
        [license.user_id, license.software_id, daysAgo(60), license.last_active_date, license.status]
      );
    }

    console.log('Seed data created successfully. Demo login: admin@company.com / demo123');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed demo data:', error.message);
    process.exit(1);
  }
};

seedDemoData();

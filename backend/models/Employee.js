import pool from '../config/db.js';

const columns = 'id, name, email, created_at';

export const listEmployees = async () =>
  (await pool.query(`SELECT ${columns} FROM employees ORDER BY id ASC`)).rows;

export const getEmployee = async (id) =>
  (await pool.query(`SELECT ${columns} FROM employees WHERE id = $1`, [id])).rows[0] || null;

export const createEmployee = async ({ name, email }) =>
  (await pool.query(`INSERT INTO employees (name, email) VALUES ($1, $2) RETURNING ${columns}`,
    [name, email])).rows[0];

export const updateEmployee = async (id, { name, email }) =>
  (await pool.query(`UPDATE employees SET name = $1, email = $2 WHERE id = $3 RETURNING ${columns}`,
    [name, email, id])).rows[0] || null;

// Restrict deletion even without a license FK (and translate FK races to 409).
export const deleteEmployee = async (id) =>
  (await pool.query(`DELETE FROM employees WHERE id = $1 AND NOT EXISTS
    (SELECT 1 FROM licenses WHERE employee_id = $1) RETURNING ${columns}`, [id])).rows[0] || null;

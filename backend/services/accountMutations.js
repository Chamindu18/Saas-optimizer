import pool from '../config/db.js';

const fail = (status, message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const validId = (value) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) fail(400, 'Invalid user ID');
  return id;
};

// Lock all current admins before checking the last-admin invariant. Both user
// mutation routes use this transaction so concurrent demotions/deletions serialize.
const mutateAccount = async (targetId, actorId, change) => {
  const id = validId(targetId);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const admins = await client.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id FOR UPDATE");
    const targetResult = await client.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1 FOR UPDATE', [id]
    );
    const target = targetResult.rows[0];
    if (!target) fail(404, 'User not found');
    if (Number(actorId) === id) fail(400, 'Cannot change or delete your own administrator account');
    const result = await change(client, target, admins.rows.length);
    await client.query('COMMIT');
    return { target, result };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const changeUserRole = (targetId, actorId, role) => {
  if (!['admin', 'manager', 'viewer'].includes(role)) fail(400, 'Invalid role');
  return mutateAccount(targetId, actorId, async (client, target, adminCount) => {
    if (target.role === 'admin' && role !== 'admin' && adminCount <= 1) {
      fail(400, 'Cannot demote the last admin');
    }
    const updated = await client.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
      [role, target.id]
    );
    return updated.rows[0];
  });
};

export const deleteAccount = (targetId, actorId) =>
  mutateAccount(targetId, actorId, async (client, target, adminCount) => {
    if (target.role === 'admin' && adminCount <= 1) fail(400, 'Cannot delete the last admin');
    const deleted = await client.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email, role, created_at', [target.id]
    );
    return deleted.rows[0];
  });

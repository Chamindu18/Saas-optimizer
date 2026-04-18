/**
 * User Model
 * 
 * Represents an employee in the company.
 * 
 * Fields:
 * - id: Unique identifier
 * - name: Employee name
 * - email: Employee email
 * - created_at: Timestamp when user was created
 */

// For now, we're using mock data stored in memory
// When connected to a real database, this will query PostgreSQL

let users = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    created_at: new Date('2024-01-15'),
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    created_at: new Date('2024-01-20'),
  },
];

/**
 * Get all users
 */
const getAllUsers = () => {
  return users;
};

/**
 * Get user by ID
 */
const getUserById = (id) => {
  return users.find(user => user.id === id);
};

/**
 * Create a new user
 */
const createUser = (userData) => {
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    name: userData.name,
    email: userData.email,
    created_at: new Date(),
  };
  users.push(newUser);
  return newUser;
};

/**
 * Update a user
 */
const updateUser = (id, userData) => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;

  users[userIndex] = {
    ...users[userIndex],
    ...userData,
    id: users[userIndex].id, // Prevent ID from being changed
    created_at: users[userIndex].created_at, // Prevent creation date from being changed
  };

  return users[userIndex];
};

/**
 * Delete a user
 */
const deleteUser = (id) => {
  const userIndex = users.findIndex(user => user.id === id);
  if (userIndex === -1) return null;

  const deletedUser = users[userIndex];
  users.splice(userIndex, 1);
  return deletedUser;
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

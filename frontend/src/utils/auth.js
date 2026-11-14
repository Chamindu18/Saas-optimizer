/**
 * Authentication Utility
 * 
 * Provides functions to manage JWT tokens and user authentication state
 * Tokens are stored in localStorage with key 'auth_token'
 */

/**
 * Get JWT token from localStorage
 * Returns: token string or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error reading token:', error);
    return null;
  }
};

/**
 * Save JWT token to localStorage
 * Args: token - JWT token string
 */
export const setToken = (token) => {
  try {
    localStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
};

/**
 * Check if user is logged in
 * Returns: true if token exists, false otherwise
 */
export const isLoggedIn = () => {
  return !!getToken();
};

/**
 * Clear token and user data, then redirect to login page
 * Called when: user logs out or token expires
 */
export const logout = () => {
  try {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

/**
 * Get user info from localStorage
 * Returns: user object or null if not found
 */
export const getUser = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error('Error reading user:', error);
    return null;
  }
};

/**
 * Set user info in localStorage
 * Args: user - user object
 */
export const setUser = (user) => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const clearAuth = () => {
  logout();
};

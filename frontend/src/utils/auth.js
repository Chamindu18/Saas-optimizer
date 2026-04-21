/**
 * Authentication Utility
 * 
 * Provides functions to manage JWT tokens and user authentication state
 * Tokens are stored in localStorage with key 'seatwatch_token'
 */

/**
 * Get JWT token from localStorage
 * Returns: token string or null if not found
 */
export const getToken = () => {
  try {
    return localStorage.getItem('seatwatch_token');
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
    localStorage.setItem('seatwatch_token', token);
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
 * Clear token and redirect to login page
 * Called when: user logs out or token expires
 */
export const logout = () => {
  try {
    localStorage.removeItem('seatwatch_token');
    window.location.href = '/login';
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

/**
 * Get user info from token (decode JWT without verification)
 * Note: This only decodes the payload - doesn't verify signature
 * Server verification happens via Authorization header
 * Returns: { userId, email } or null if token invalid
 */
export const getUserFromToken = () => {
  try {
    const token = getToken();
    if (!token) return null;

    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload (it's base64url encoded)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString()
    );

    return {
      userId: payload.userId,
      email: payload.email,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

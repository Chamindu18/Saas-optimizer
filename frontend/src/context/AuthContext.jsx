/**
 * =====================================================
 * AUTH CONTEXT - Global Authentication State
 * =====================================================
 * Manages:
 * - User authentication state
 * - JWT token storage and retrieval
 * - User role and permissions
 * - Login/logout functionality
 * - Protected route access
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../services/api';
import { clearAuth, getToken, setToken, setUser as saveUser } from '../utils/auth';

// Create context
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 * Wrap your app with this to enable authentication
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize authentication from localStorage
   */
  useEffect(() => {
    let active = true;
    const restore = async (initial = false) => {
      if (!getToken()) { if (initial) setLoading(false); return; }
      try {
        const currentUser = await authAPI.me();
        if (active) {
          saveUser(currentUser);
          setUser(currentUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        if (active) { clearAuth(); setUser(null); setIsAuthenticated(false); }
      } finally {
        if (active && initial) setLoading(false);
      }
    };
    restore(true);
    const expire = () => { setUser(null); setIsAuthenticated(false); };
    const refreshOnFocus = () => { if (document.visibilityState === 'visible') void restore(); };
    window.addEventListener('seatwatch:session-expired', expire);
    window.addEventListener('focus', refreshOnFocus);
    return () => { active = false; window.removeEventListener('seatwatch:session-expired', expire); window.removeEventListener('focus', refreshOnFocus); };
  }, []);

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @throws {Error} Login error
   */
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.login(email, password);

      // Store token and user
      setToken(response.token);
      saveUser(response.user);

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);

      return response.user;
    } catch (err) {
      const message = err.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Register user
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @throws {Error} Registration error
   */
  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authAPI.register(name, email, password);

      // Store token and user
      setToken(response.token);
      saveUser(response.user);

      // Update state
      setUser(response.user);
      setIsAuthenticated(true);

      return response.user;
    } catch (err) {
      const message = err.message || 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    // Clear storage
    clearAuth();

    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  }, []);

  /**
   * Update user in state (after API changes)
   */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    saveUser(updatedUser);
  }, []);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback(
    (role) => {
      if (!user) return false;
      return user.role === role || (Array.isArray(user.role) && user.role.includes(role));
    },
    [user]
  );

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);

  /**
   * Check if user is manager
   */
  const isManager = useCallback(() => hasRole('manager') || isAdmin(), [hasRole, isAdmin]);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * Usage: const { user, login, logout } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

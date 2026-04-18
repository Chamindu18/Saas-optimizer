/**
 * Helper Utilities
 * 
 * This file contains reusable utility functions.
 * Currently empty, but can be expanded for:
 * - Date formatting
 * - Data validation
 * - Common calculations
 * - Error handling
 */

/**
 * Format date to readable string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Check if email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate error response
 */
const generateErrorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    error: message,
    status: statusCode,
  };
};

/**
 * Generate success response
 */
const generateSuccessResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data,
  };
};

module.exports = {
  formatDate,
  isValidEmail,
  generateErrorResponse,
  generateSuccessResponse,
};

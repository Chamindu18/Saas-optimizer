// Format currency
export const formatMoney = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format currency (alias for formatMoney)
export const formatCurrency = (amount, currency = 'USD') => {
  return formatMoney(amount, currency);
};

// Format date
export const formatDate = (date, format = 'short') => {
  const d = new Date(date);
  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (format === 'long') {
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString();
};

// Format date in short format (alias for formatDate with 'short')
export const formatDateShort = (date) => {
  return formatDate(date, 'short');
};

// Format relative time
export const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date, 'short');
};

// Format days idle
export const formatDaysIdle = (days) => {
  if (days === 0) return 'Active today';
  if (days === 1) return 'Idle 1 day';
  if (days < 30) return `Idle ${days} days`;
  const months = Math.floor(days / 30);
  return `Idle ${months} month${months > 1 ? 's' : ''}`;
};

// Calculate days since a date
export const daysSinceDate = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diff = now - then;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

// Format percentage
export const formatPercent = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format number with comma separators
export const formatNumber = (num) => {
  return num.toLocaleString();
};

// Capitalize first letter of string
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Get color for role badge
export const getRoleColor = (role) => {
  const colors = {
    admin: '#ff6b6b',
    manager: '#4ecdc4',
    user: '#95e1d3',
    guest: '#d1d5db',
  };
  return colors[role?.toLowerCase()] || '#95e1d3';
};

// Get display name for role
export const getRoleDisplayName = (role) => {
  const displayNames = {
    admin: 'Administrator',
    manager: 'Manager',
    user: 'User',
    guest: 'Guest',
  };
  return displayNames[role?.toLowerCase()] || capitalize(role) || 'User';
};

// Format currency
export const formatMoney = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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

// Format percentage
export const formatPercent = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

// Format number with comma separators
export const formatNumber = (num) => {
  return num.toLocaleString();
};

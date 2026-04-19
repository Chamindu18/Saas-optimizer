import React from 'react';

// StatCard component for displaying a metric/statistic
// Props: 
//   title - label for the statistic
//   value - the actual value to display
//   subtitle - optional subtitle below value
function StatCard({ title, value, subtitle }) {
  const statCardStyles = {
    card: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.2s ease',
    },
    title: {
      fontSize: '12px',
      fontWeight: '500',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      margin: '0 0 12px 0',
    },
    value: {
      fontSize: '36px',
      fontWeight: '700',
      color: '#2563eb',
      margin: '0 0 8px 0',
    },
    subtitle: {
      fontSize: '13px',
      color: '#94a3b8',
      margin: 0,
    },
  };

  return (
    <div style={statCardStyles.card}>
      <p style={statCardStyles.title}>{title}</p>
      <h3 style={statCardStyles.value}>{value}</h3>
      {subtitle && <p style={statCardStyles.subtitle}>{subtitle}</p>}
    </div>
  );
}

export default StatCard;

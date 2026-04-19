import React from 'react';

// StatCard component for displaying a metric/statistic
// Props: 
//   title - label for the statistic
//   value - the actual value to display
//   subtitle - optional subtitle below value
//   color - optional color theme (blue, green, purple, neutral)
function StatCard({ title, value, subtitle, color = 'blue' }) {
  // Define color accents for different stat types
  const colorThemes = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    neutral: '#6366f1',
  };
  const selectedColor = colorThemes[color] || colorThemes.blue;

  const statCardStyles = {
    card: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '28px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      borderTop: `4px solid ${selectedColor}`,
      cursor: 'default',
    },
    cardHover: {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
    title: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#94a3b8',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      margin: '0 0 16px 0',
    },
    value: {
      fontSize: '44px',
      fontWeight: '700',
      color: '#1e293b',
      margin: '0 0 12px 0',
      lineHeight: '1.1',
    },
    subtitle: {
      fontSize: '13px',
      color: '#94a3b8',
      margin: 0,
    },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div 
      style={{
        ...statCardStyles.card,
        ...(isHovered ? statCardStyles.cardHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <p style={statCardStyles.title}>{title}</p>
      <h3 style={statCardStyles.value}>{value}</h3>
      {subtitle && <p style={statCardStyles.subtitle}>{subtitle}</p>}
    </div>
  );
}

export default StatCard;

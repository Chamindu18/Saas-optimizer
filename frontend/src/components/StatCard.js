import React from 'react';

function StatCard({ title, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{title}</div>
      <div className="stat-value">{value}</div>
      {subtitle && <div className="stat-change">{subtitle}</div>}
    </div>
  );
}

export default StatCard;

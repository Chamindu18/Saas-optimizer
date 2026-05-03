import React from 'react';
import '../styles/components/MetricCard.css';

export default function MetricCard({
  label,
  value,
  unit = '',
  trend = null,
  trendDirection = null,
  icon = null,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="metric-card">
        <div className="metric-card-header">
          <div className="skeleton skeleton-text" style={{ width: '100px' }}></div>
        </div>
        <div className="metric-card-body">
          <div className="skeleton skeleton-text" style={{ width: '150px', height: '32px' }}></div>
        </div>
      </div>
    );
  }

  const isTrendPositive = trendDirection === 'up';
  const isTrendNegative = trendDirection === 'down';

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        {icon && <div className="metric-card-icon">{icon}</div>}
        <h3 className="metric-card-label">{label}</h3>
      </div>
      
      <div className="metric-card-body">
        <div className="metric-card-value">
          {value}
          {unit && <span className="metric-card-unit">{unit}</span>}
        </div>
        
        {trend !== null && (
          <div className={`metric-card-trend ${isTrendPositive ? 'trend-positive' : isTrendNegative ? 'trend-negative' : 'trend-neutral'}`}>
            {isTrendPositive && <span className="trend-icon">↑</span>}
            {isTrendNegative && <span className="trend-icon">↓</span>}
            <span className="trend-value">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

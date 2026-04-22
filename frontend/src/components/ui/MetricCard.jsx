import React from 'react';

export default function MetricCard({
  label,
  value,
  sub,
  accentColor = 'var(--gold)',
  trend,
  trendColor,
  animate = true,
}) {
  return (
    <div className="metric-card" style={{ '--accent-color': accentColor, '--value-color': accentColor }}>
      <div className="metric-card-label">{label}</div>
      <div className={`metric-card-value ${animate ? 'count-up' : ''}`} style={{ color: accentColor }}>
        {value}
      </div>
      {sub && <div className="metric-card-sub">{sub}</div>}
      {trend && (
        <div className="metric-card-trend" style={{ color: trendColor }}>
          {trend}
        </div>
      )}
    </div>
  );
}

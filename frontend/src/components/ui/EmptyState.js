import React from 'react';
import '../styles/components/EmptyState.css';

export default function EmptyState({
  title,
  description,
  icon = null,
  action = null,
  actionText = 'Get Started',
}) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      
      <h3 className="empty-state-title">{title}</h3>
      
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      
      {action && (
        <div className="empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}

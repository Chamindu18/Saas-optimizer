import React from 'react';
import '../styles/components/Alert.css';

export default function Alert({
  type = 'info',
  title,
  message,
  icon = null,
  action = null,
  onClose = null,
  className = '',
}) {
  return (
    <div className={`alert alert-${type} ${className}`}>
      <div className="alert-content">
        {icon && <div className="alert-icon">{icon}</div>}
        
        <div className="alert-body">
          {title && <h4 className="alert-title">{title}</h4>}
          {message && <p className="alert-message">{message}</p>}
        </div>
      </div>
      
      {action && <div className="alert-action">{action}</div>}
      
      {onClose && (
        <button
          className="alert-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
}

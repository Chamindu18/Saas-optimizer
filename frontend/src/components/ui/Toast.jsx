import React from 'react';

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

const iconMap = {
  success: <IconCheck />,
  error: <IconX />,
  warning: <IconAlertCircle />,
  info: <IconInfo />,
};

export default function Toast({ id, type = 'info', title, message, onClose, duration = 4000 }) {
  React.useEffect(() => {
    if (duration) {
      const timeout = setTimeout(() => onClose?.(id), duration);
      return () => clearTimeout(timeout);
    }
  }, [id, duration, onClose]);

  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">{iconMap[type]}</div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        {message && <div className="toast-message">{message}</div>}
      </div>
      <button className="toast-close" onClick={() => onClose?.(id)}>
        ×
      </button>
    </div>
  );
}

import React from 'react';

const IconAlertCircle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="alert-banner-icon-svg">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="alert-banner-icon-svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const iconMap = {
  danger: <IconAlertCircle />,
  warning: <IconAlertCircle />,
  success: <IconCheck />,
};

export default function AlertBanner({
  variant = 'danger',
  title,
  message,
  action,
  actionLabel = 'Review Now',
  onAction,
}) {
  return (
    <div className={`alert-banner ${variant}`}>
      <div className="alert-banner-icon">{iconMap[variant]}</div>
      <div className="alert-banner-content">
        {title && <div className="alert-banner-title">{title}</div>}
        {message && <div className="alert-banner-message">{message}</div>}
      </div>
      {onAction && (
        <div className="alert-banner-action">
          <button
            className="btn btn-sm btn-primary"
            onClick={onAction}
            style={{ minWidth: '100px' }}
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* Add custom styling for alert banner icons */
export const AlertBannerIconStyles = `
.alert-banner-icon-svg {
  color: currentColor;
}

.alert-banner.danger .alert-banner-icon-svg {
  color: var(--danger-text);
}

.alert-banner.warning .alert-banner-icon-svg {
  color: var(--warning-text);
}

.alert-banner.success .alert-banner-icon-svg {
  color: var(--success-text);
}
`;

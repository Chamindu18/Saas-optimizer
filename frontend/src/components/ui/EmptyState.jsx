import React from 'react';

const IconInbox = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polyline points="22 12 18 12 15 21 9 21 6 12 2 12"></polyline>
    <path d="M6 12v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"></path>
  </svg>
);

export default function EmptyState({
  icon = <IconInbox />,
  title = 'No items found',
  message = 'There are no items to display.',
  action,
  actionLabel = 'Create',
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && (
        <div className="empty-state-action">
          <button className="btn btn-primary" onClick={action}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

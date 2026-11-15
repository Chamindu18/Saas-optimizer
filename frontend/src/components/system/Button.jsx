import React from 'react';

export function Button({ variant = 'secondary', size = 'default', loading = false, className = '', children, disabled, ...props }) {
  return <button className={`sw-button sw-button--${variant} sw-button--${size} ${className}`} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
    {loading && <span className="sw-button__spinner" aria-hidden="true" />}
    {children}
    {loading && <span className="sw-sr-only" role="status">Working…</span>}
  </button>;
}

/**
 * Button Component
 * Reusable button with multiple variants and sizes
 */

import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon = null,
  type = 'button',
  className = '',
  onClick,
  ...props
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    disabled && 'btn--disabled',
    loading && 'btn--loading',
    fullWidth && 'btn--full-width',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn__spinner"></span>
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {Icon && <Icon className="btn__icon" />}
          {children}
        </>
      )}
    </button>
  );
}

export default Button;

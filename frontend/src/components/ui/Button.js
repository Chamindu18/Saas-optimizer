import React from 'react';
import '../styles/components/Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn btn-${variant} btn-${size} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner spinner-sm"></span>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

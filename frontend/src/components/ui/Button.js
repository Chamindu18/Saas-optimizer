import React from 'react';
import '../styles/components/Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  block = false,
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
      className={`btn btn-${variant} btn-${size} ${block ? 'btn-block' : ''} ${className}`.trim()}
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

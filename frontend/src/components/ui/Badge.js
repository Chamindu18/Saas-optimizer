import React from 'react';
import '../styles/components/Badge.css';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`}>
      {children}
    </span>
  );
}

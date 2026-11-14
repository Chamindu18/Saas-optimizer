/**
 * Badge Component
 * Status and label badges
 */

import React from 'react';
import './Badge.css';

export function Badge({ children, variant = 'primary', size = 'sm', className = '' }) {
  const classes = ['badge', `badge--${variant}`, `badge--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}

export default Badge;

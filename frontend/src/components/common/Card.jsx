/**
 * Card Component
 * Reusable container component with elevation
 */

import React from 'react';
import './Card.css';

export function Card({
  children,
  className = '',
  padding = 'md',
  elevated = true,
  hoverable = false,
  ...props
}) {
  const classes = [
    'card',
    `card--p-${padding}`,
    elevated && 'card--elevated',
    hoverable && 'card--hoverable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export default Card;

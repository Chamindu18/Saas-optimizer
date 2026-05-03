import React from 'react';
import '../styles/components/Card.css';

export default function Card({
  children,
  className = '',
  padding = true,
  border = true,
  shadow = 'md',
  hover = false,
  ...props
}) {
  const classes = [
    'card',
    padding && 'card-padded',
    border && 'card-bordered',
    shadow && `card-shadow-${shadow}`,
    hover && 'card-hover',
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

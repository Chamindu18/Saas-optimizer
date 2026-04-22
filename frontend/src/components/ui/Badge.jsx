import React from 'react';

export default function Badge({ children, variant = 'secondary', className = '', ...props }) {
  const classes = [`badge`, `badge-${variant}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
}

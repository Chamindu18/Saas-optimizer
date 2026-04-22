import React from 'react';

export default function Card({ children, className = '', hover = true, ...props }) {
  const classes = [`card`, !hover && 'no-hover', className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, ...props }) {
  return (
    <div className="card-header" {...props}>
      {children}
    </div>
  );
}

export function CardBody({ children, ...props }) {
  return (
    <div className="card-body" {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, ...props }) {
  return (
    <div className="card-footer" {...props}>
      {children}
    </div>
  );
}

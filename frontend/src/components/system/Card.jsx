import React from 'react';
export function Card({ children, className = '', ...props }) { return <div className={`sw-card ${className}`} {...props}>{children}</div>; }

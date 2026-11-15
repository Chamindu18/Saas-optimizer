import React from 'react';
export function Badge({ children, tone = 'neutral', className = '', ...props }) { return <span className={`sw-badge sw-badge--${tone} ${className}`} {...props}>{children}</span>; }

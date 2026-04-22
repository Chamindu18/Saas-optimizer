import React from 'react';
import '../styles/PageHeader.css';

export default function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="page-header">
      <div className="page-header-content">
        <div className="page-header-text">
          {title && <h1 className="page-header-title">{title}</h1>}
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-header-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

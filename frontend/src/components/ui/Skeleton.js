import React from 'react';
import '../styles/components/Spinner.css';

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`spinner spinner-${size} ${className}`} aria-busy="true"></div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`skeleton skeleton-card ${className}`}>
      <div className="skeleton-line" style={{ height: '20px', marginBottom: '8px' }}></div>
      <div className="skeleton-line" style={{ height: '32px', marginBottom: '16px' }}></div>
      <div className="skeleton-line" style={{ height: '16px', width: '60%' }}></div>
    </div>
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`skeleton ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton-line"
          style={{
            height: '16px',
            marginBottom: i < lines - 1 ? '8px' : '0',
            width: i === lines - 1 ? '80%' : '100%',
          }}
        ></div>
      ))}
    </div>
  );
}

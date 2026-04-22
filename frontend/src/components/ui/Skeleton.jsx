import React from 'react';

export function Skeleton({ className = '', ...props }) {
  return <div className={`skeleton ${className}`} {...props} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text large" />
      <div className="skeleton skeleton-text" />
    </div>
  );
}

export function SkeletonText({ className = '', lines = 1, ...props }) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`skeleton skeleton-text ${i === lines - 1 ? 'large' : ''} ${className}`} {...props} />
      ))}
    </>
  );
}

export function SkeletonAvatar() {
  return <div className="skeleton skeleton-avatar" />;
}

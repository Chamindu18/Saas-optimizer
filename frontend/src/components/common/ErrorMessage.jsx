/**
 * Error Message Component
 */

import React from 'react';
import './ErrorMessage.css';

export function ErrorMessage({ message, onDismiss = null }) {
  if (!message) return null;

  return (
    <div className="error-message" role="alert">
      <div className="error-message__icon">⚠️</div>
      <div className="error-message__content">
        <p className="error-message__text">{message}</p>
      </div>
      {onDismiss && (
        <button className="error-message__close" onClick={onDismiss} aria-label="Close error">
          ✕
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;

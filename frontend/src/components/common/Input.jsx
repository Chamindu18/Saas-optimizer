/**
 * Input Component
 * Reusable form input with validation and error states
 */

import React from 'react';
import './Input.css';

export function Input({
  label,
  type = 'text',
  placeholder,
  error,
  required,
  disabled,
  value,
  onChange,
  onBlur,
  helperText,
  icon: Icon = null,
  ...props
}) {
  const hasError = Boolean(error);

  return (
    <div className="input-group">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className={`input-wrapper ${hasError ? 'input-wrapper--error' : ''}`}>
        {Icon && <Icon className="input-icon" />}
        <input
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`input ${hasError ? 'input--error' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="input-error">{error}</p>}
      {helperText && !error && <p className="input-helper">{helperText}</p>}
    </div>
  );
}

export default Input;

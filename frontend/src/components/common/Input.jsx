/**
 * Input Component
 * Reusable form input with validation and error states
 */

import React, { useId } from 'react';
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
  id,
  ...props
}) {
  const hasError = Boolean(error);
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = `${inputId}-description`;

  return (
    <div className="input-group">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      <div className={`input-wrapper ${hasError ? 'input-wrapper--error' : ''}`}>
        {Icon && <Icon className="input-icon" />}
        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`input ${hasError ? 'input--error' : ''}`}
          required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={error || helperText ? descriptionId : undefined}
          {...props}
        />
      </div>
      {error && <p id={descriptionId} className="input-error" role="alert">{error}</p>}
      {helperText && !error && <p id={descriptionId} className="input-helper">{helperText}</p>}
    </div>
  );
}

export default Input;

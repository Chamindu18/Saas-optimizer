import React, { useState } from 'react';
import '../styles/components/Input.css';

export default function Input({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  errorMessage,
  disabled = false,
  required = false,
  hint,
  className = '',
  ...props
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className="input-container">
        <input
          type={type}
          className={`input ${error ? 'input-error' : ''} ${focused ? 'input-focused' : ''} ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          {...props}
        />
      </div>
      
      {error && errorMessage && (
        <span className="input-error-text">{errorMessage}</span>
      )}
      
      {hint && !error && (
        <span className="input-hint">{hint}</span>
      )}
    </div>
  );
}

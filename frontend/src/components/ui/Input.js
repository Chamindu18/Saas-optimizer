import React, { useId, useState } from 'react';
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
  id,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = `${inputId}-description`;

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}
      
      <div className="input-container">
        <input
          id={inputId}
          type={type}
          className={`input ${error ? 'input-error' : ''} ${focused ? 'input-focused' : ''} ${className}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorMessage || hint ? descriptionId : undefined}
          {...props}
        />
      </div>
      
      {error && errorMessage && (
        <span id={descriptionId} className="input-error-text" role="alert">{errorMessage}</span>
      )}
      
      {hint && !error && (
        <span id={descriptionId} className="input-hint">{hint}</span>
      )}
    </div>
  );
}

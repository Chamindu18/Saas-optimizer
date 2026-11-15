import React, { useId } from 'react';

export function Field({ label, hint, error, id, className = '', required, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const descriptionId = `${inputId}-description`;
  return <div className={`sw-field ${className}`}>
    <label htmlFor={inputId} className="sw-field__label">{label}{required && <span aria-hidden="true"> *</span>}</label>
    <input id={inputId} required={required} aria-invalid={Boolean(error) || undefined} aria-describedby={hint || error ? descriptionId : undefined} className="sw-field__control" {...props} />
    {error ? <p id={descriptionId} className="sw-field__error" role="alert">{error}</p> : hint ? <p id={descriptionId} className="sw-field__hint">{hint}</p> : null}
  </div>;
}

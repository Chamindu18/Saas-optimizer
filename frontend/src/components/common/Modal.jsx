/**
 * Modal Component
 */

import React, { useEffect } from 'react';
import './Modal.css';

export function Modal({
  isOpen,
  title,
  children,
  onClose,
  size = 'md',
  showCloseButton = true,
  actions = null,
}) {
  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal modal--${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          {showCloseButton && (
            <button className="modal__close" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          )}
        </div>
        <div className="modal__content">{children}</div>
        {actions && <div className="modal__footer">{actions}</div>}
      </div>
    </div>
  );
}

export default Modal;

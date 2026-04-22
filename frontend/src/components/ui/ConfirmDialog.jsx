import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';

const IconAlertCircle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  requiresInput = false,
  inputPlaceholder = 'Type to confirm',
}) {
  const [inputValue, setInputValue] = useState('');

  const canConfirm = !requiresInput || inputValue.toLowerCase() === 'confirm';

  const handleConfirm = () => {
    onConfirm?.();
    setInputValue('');
  };

  const handleClose = () => {
    onClose?.();
    setInputValue('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnEscape={true}
      closeOnOverlay={true}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '24px',
            color: type === 'danger' ? 'var(--danger-text)' : 'var(--warning-text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '40px',
          }}
        >
          <IconAlertCircle />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {message}
          </p>
          {requiresInput && (
            <input
              type="text"
              className="input"
              placeholder={inputPlaceholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
        <Button variant="ghost" onClick={handleClose}>
          {cancelText}
        </Button>
        <Button variant={type} onClick={handleConfirm} disabled={!canConfirm}>
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

import React from 'react';
import { Dialog } from '../system/Dialog';

// Compatibility API for active management forms; Radix handles focus and Escape.
export function Modal({ isOpen, title, children, onClose, size = 'md', actions }) {
  return <Dialog open={isOpen} onOpenChange={open => { if (!open) onClose?.(); }} title={title} footer={actions} className={`sw-dialog--${size}`}>
    {children}
  </Dialog>;
}

export default Modal;

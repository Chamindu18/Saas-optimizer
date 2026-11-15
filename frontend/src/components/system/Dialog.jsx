import React, { useRef } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Dialog({ open, onOpenChange, title, description, children, footer, className = '' }) {
  const returnFocusRef = useRef(null);
  const contentRef = useRef(null);
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sw-overlay sw-overlay__backdrop" />
      <DialogPrimitive.Content ref={contentRef} className={`sw-overlay sw-dialog ${className}`} aria-describedby={undefined} onOpenAutoFocus={event => {
        returnFocusRef.current = document.activeElement;
        const field = contentRef.current?.querySelector('input:not(:disabled), select:not(:disabled), textarea:not(:disabled)');
        if (field) { event.preventDefault(); field.focus(); }
      }} onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef.current?.focus?.(); }}>
        <div className="sw-dialog__header">
          <div><DialogPrimitive.Title className="sw-dialog__title">{title}</DialogPrimitive.Title>
            {description && <DialogPrimitive.Description className="sw-dialog__description">{description}</DialogPrimitive.Description>}
          </div>
          <DialogPrimitive.Close className="sw-icon-button" aria-label="Close dialog"><X size={18} aria-hidden="true" /></DialogPrimitive.Close>
        </div>
        <div className="sw-dialog__body">{children}</div>
        {footer && <div className="sw-dialog__footer">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

export { DialogPrimitive };

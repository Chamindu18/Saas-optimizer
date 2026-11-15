import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Sheet({ open, onOpenChange, title, children, returnFocusRef }) {
  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="sw-overlay sw-overlay__backdrop" />
      <DialogPrimitive.Content className="sw-overlay sw-sheet" aria-describedby={undefined} onCloseAutoFocus={event => { event.preventDefault(); returnFocusRef?.current?.focus(); }}>
        <div className="sw-sheet__header"><DialogPrimitive.Title className="sw-sheet__title">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close className="sw-icon-button" aria-label="Close navigation"><X size={18} aria-hidden="true" /></DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}

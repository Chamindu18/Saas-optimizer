import React from 'react';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';

export function DropdownMenu({ trigger, label, children }) {
  return <DropdownPrimitive.Root>
    <DropdownPrimitive.Trigger asChild>{trigger}</DropdownPrimitive.Trigger>
    <DropdownPrimitive.Portal><DropdownPrimitive.Content className="sw-overlay sw-menu" align="end" sideOffset={6} aria-label={label}>
      {children}
    </DropdownPrimitive.Content></DropdownPrimitive.Portal>
  </DropdownPrimitive.Root>;
}

export const DropdownMenuItem = DropdownPrimitive.Item;
export const DropdownMenuLabel = DropdownPrimitive.Label;

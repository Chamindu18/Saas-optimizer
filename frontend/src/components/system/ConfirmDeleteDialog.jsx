import React from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export function ConfirmDeleteDialog({ item, kind, busy, error, onClose, onConfirm }) {
  return <Dialog open={Boolean(item)} onOpenChange={open => { if (!open && !busy) onClose(); }}
    title={`Delete ${kind}`} description={`Confirm deletion of ${item?.name || `this ${kind}`}.`}>
    <p className="sw-management__confirm-copy">{kind === 'employee'
      ? 'Employees with assigned license history cannot be deleted.'
      : 'Software with license history cannot be deleted.'}</p>
    {error && <p className="sw-management__feedback sw-management__feedback--error" role="alert">{error}</p>}
    <div className="sw-management__dialog-actions">
      <Button type="button" onClick={onClose} disabled={busy}>Cancel</Button>
      <Button type="button" variant="destructive" onClick={onConfirm} loading={busy}>Delete {kind}</Button>
    </div>
  </Dialog>;
}

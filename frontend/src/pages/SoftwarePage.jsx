import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { softwareAPI, apiErrorMessage } from '../services/api';
import { useRole } from '../hooks/useRole';
import { Button } from '../components/system/Button';
import { Card } from '../components/system/Card';
import { Field } from '../components/system/Field';
import { Dialog } from '../components/system/Dialog';
import { ManagementTable } from '../components/system/ManagementTable';
import { ConfirmDeleteDialog } from '../components/system/ConfirmDeleteDialog';
import './ManagementPages.css';

const empty = { name: '', category: '', price_per_seat: '' };
const validPrice = value => /^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(String(value));
const amount = value => {
  const text = String(value ?? '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) return 'Unavailable';
  const [whole, decimal = ''] = text.split('.');
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal.padEnd(2, '0')}`;
};

export default function SoftwarePage() {
  const { isManager, isAdmin } = useRole();
  const { data, isLoading, error: fetchError, execute: refetch } = useAsync(softwareAPI.getAllSoftware);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const software = Array.isArray(data) ? data : [];
  const openForm = item => {
    setEditing(item || 'new');
    setForm(item ? { name: item.name, category: item.category, price_per_seat: String(item.price_per_seat) } : empty);
    setErrors({}); setFormError(''); setFeedback('');
  };
  const closeForm = () => { if (!busy) setEditing(null); };
  const change = event => {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: value }));
    setErrors(current => ({ ...current, [name]: undefined }));
  };
  const save = async event => {
    event.preventDefault();
    const next = {};
    const name = form.name.trim();
    const category = form.category.trim();
    if (!name) next.name = 'Software name is required.';
    if (!category) next.category = 'Category is required.';
    if (form.price_per_seat === '') next.price_per_seat = 'Monthly price is required.';
    else if (!validPrice(form.price_per_seat)) next.price_per_seat = 'Enter a nonnegative monthly price up to 99,999,999.99 with at most two decimals.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setFormError('');
    try {
      const payload = { name, category, price_per_seat: Number(form.price_per_seat) };
      if (editing === 'new') await softwareAPI.createSoftware(payload.name, payload.category, payload.price_per_seat);
      else await softwareAPI.updateSoftware(editing.id, payload);
      setEditing(null); setFeedback(editing === 'new' ? 'Software created.' : 'Software updated.');
      await refetch();
    } catch (error) { setFormError(apiErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setDeleteError('');
    try {
      await softwareAPI.deleteSoftware(deleting.id);
      setDeleting(null); setFeedback('Software deleted.');
      await refetch();
    } catch (error) {
      setDeleteError(error.response?.status === 409
        ? 'This software has license history and cannot be deleted.' : apiErrorMessage(error));
    } finally { setBusy(false); }
  };
  const columns = [
    { key: 'name', label: 'Software', className: 'sw-management__identity', render: row => row.name },
    { key: 'category', label: 'Category', className: 'sw-management__long' },
    { key: 'price_per_seat', label: 'Monthly price per seat', className: 'sw-management__amount', render: row => amount(row.price_per_seat) },
    ...(isManager ? [{ key: 'actions', label: 'Actions', className: 'sw-management__actions', render: row => <div className="sw-management__row-actions">
      <Button type="button" onClick={() => openForm(row)} aria-label={`Edit ${row.name}`}>Edit</Button>
      {isAdmin && <Button type="button" variant="ghost" onClick={() => { setDeleting(row); setDeleteError(''); }} aria-label={`Delete ${row.name}`}>Delete</Button>}
    </div> }] : []),
  ];
  return <div className="sw-management">
    <header className="sw-management__header"><div><p className="sw-management__eyebrow">Catalog</p><h1>Software</h1>
      <p>Software available for license assignments and its estimated monthly price per seat.</p></div>
      {isManager && <Button variant="primary" onClick={() => openForm(null)}>Add software</Button>}</header>
    <div className="sw-management__toolbar"><p>{!isLoading && !fetchError ? `${software.length} software record${software.length === 1 ? '' : 's'}` : 'Software catalog'}</p></div>
    {feedback && <p className="sw-management__feedback" role="status">{feedback}</p>}
    {fetchError ? <div className="sw-management__state" role="alert"><h2>Software could not be loaded</h2><p>{apiErrorMessage(fetchError)}</p><Button onClick={() => refetch()}>Retry loading software</Button></div>
      : isLoading && !data ? <div className="sw-management__state" role="status">Loading software…</div>
      : !software.length ? <div className="sw-management__state"><h2>No software yet</h2><p>Add software to make it available for license assignments.</p>{isManager && <Button variant="primary" onClick={() => openForm(null)}>Add software</Button>}</div>
      : <Card className="sw-management__panel"><p className="sw-management__scroll-hint">Scroll horizontally to see all columns.</p><ManagementTable label="Software" columns={columns} rows={software} rowKey={row => row.id} /></Card>}
    <Dialog open={Boolean(editing)} onOpenChange={open => { if (!open) closeForm(); }} title={editing === 'new' ? 'Add software' : 'Edit software'}
      description="Set the catalog details and estimated monthly price per seat.">
      <form noValidate onSubmit={save} className="sw-management__form">
        {formError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{formError}</p>}
        <Field label="Software name" name="name" value={form.name} onChange={change} error={errors.name} required />
        <Field label="Category" name="category" value={form.category} onChange={change} error={errors.category} required />
        <Field label="Monthly price per seat" hint="Enter an amount without a currency symbol." name="price_per_seat" type="text" inputMode="decimal" value={form.price_per_seat} onChange={change} error={errors.price_per_seat} required />
        <div className="sw-management__dialog-actions"><Button type="button" onClick={closeForm} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>{editing === 'new' ? 'Create software' : 'Save changes'}</Button></div>
      </form>
    </Dialog>
    <ConfirmDeleteDialog item={deleting} kind="software" busy={busy} error={deleteError} onClose={() => setDeleting(null)} onConfirm={remove} />
  </div>;
}

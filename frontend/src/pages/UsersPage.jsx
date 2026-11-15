import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { employeeAPI, apiErrorMessage } from '../services/api';
import { useRole } from '../hooks/useRole';
import { Button } from '../components/system/Button';
import { Card } from '../components/system/Card';
import { Field } from '../components/system/Field';
import { Dialog } from '../components/system/Dialog';
import { ManagementTable } from '../components/system/ManagementTable';
import { ConfirmDeleteDialog } from '../components/system/ConfirmDeleteDialog';
import { isValidEmail } from '../utils/formatters';
import './ManagementPages.css';

const empty = { name: '', email: '' };

export default function UsersPage() {
  const { isManager } = useRole();
  const { data, isLoading, error: fetchError, execute: refetch } = useAsync(employeeAPI.getAll);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const employees = Array.isArray(data) ? data : [];
  const visible = employees.filter(employee => `${employee.name} ${employee.email}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  const openForm = employee => {
    setEditing(employee || 'new');
    setForm(employee ? { name: employee.name, email: employee.email } : empty);
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
    const email = form.email.trim();
    if (!name) next.name = 'Name is required.';
    else if (name.length > 120) next.name = 'Name must be 120 characters or fewer.';
    if (!email) next.email = 'Email is required.';
    else if (email.length > 255 || !isValidEmail(email)) next.email = 'Enter a valid email address of 255 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true); setFormError('');
    try {
      if (editing === 'new') await employeeAPI.create(name, email);
      else await employeeAPI.update(editing.id, name, email);
      setEditing(null);
      setFeedback(editing === 'new' ? 'Employee created.' : 'Employee updated.');
      await refetch();
    } catch (error) { setFormError(apiErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setDeleteError('');
    try {
      await employeeAPI.remove(deleting.id);
      setDeleting(null); setFeedback('Employee deleted.');
      await refetch();
    } catch (error) {
      setDeleteError(error.response?.status === 409
        ? 'This employee has license history. Remove their licenses before deleting the employee.'
        : apiErrorMessage(error));
    } finally { setBusy(false); }
  };
  const columns = [
    { key: 'name', label: 'Employee', className: 'sw-management__identity', render: row => row.name },
    { key: 'email', label: 'Email', className: 'sw-management__long', render: row => row.email },
    ...(isManager ? [{ key: 'actions', label: 'Actions', className: 'sw-management__actions', render: row => <div className="sw-management__row-actions">
      <Button type="button" variant="secondary" onClick={() => openForm(row)} aria-label={`Edit ${row.name}`}>Edit</Button>
      <Button type="button" variant="ghost" onClick={() => { setDeleting(row); setDeleteError(''); }} aria-label={`Delete ${row.name}`}>Delete</Button>
    </div> }] : []),
  ];

  return <div className="sw-management">
    <header className="sw-management__header"><div><p className="sw-management__eyebrow">Directory</p><h1>Employees</h1>
      <p>People who can be assigned software licenses. Adding an employee does not create a login account.</p></div>
      {isManager && <Button variant="primary" onClick={() => openForm(null)}>Add employee</Button>}</header>
    <div className="sw-management__toolbar"><p>{!isLoading && !fetchError ? `${employees.length} employee${employees.length === 1 ? '' : 's'}` : 'Employee directory'}</p>
      {!isLoading && !fetchError && employees.length > 0 && <label className="sw-management__search">Search employees
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or email" /></label>}</div>
    {feedback && <p className="sw-management__feedback" role="status">{feedback}</p>}
    {fetchError ? <div className="sw-management__state" role="alert"><h2>Employees could not be loaded</h2><p>{apiErrorMessage(fetchError)}</p><Button onClick={() => refetch()}>Retry loading employees</Button></div>
      : isLoading && !data ? <div className="sw-management__state" role="status">Loading employees…</div>
      : !employees.length ? <div className="sw-management__state"><h2>No employees yet</h2><p>Add an employee to start assigning software licenses.</p>{isManager && <Button variant="primary" onClick={() => openForm(null)}>Add employee</Button>}</div>
      : !visible.length ? <div className="sw-management__state"><h2>No matching employees</h2><p>Try a different name or email.</p><Button onClick={() => setSearch('')}>Clear search</Button></div>
      : <Card className="sw-management__panel sw-management__panel--employees"><p className="sw-management__scroll-hint">Scroll horizontally to see all columns.</p><ManagementTable label="Employees" columns={columns} rows={visible} rowKey={row => row.id} /></Card>}
    <Dialog open={Boolean(editing)} onOpenChange={open => { if (!open) closeForm(); }} title={editing === 'new' ? 'Add employee' : 'Edit employee'}
      description="Employee records are for license assignments and do not provide login access.">
      <form noValidate onSubmit={save} className="sw-management__form">
        {formError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{formError}</p>}
        <Field label="Name" name="name" value={form.name} onChange={change} error={errors.name} maxLength={121} required />
        <Field label="Email" name="email" type="email" value={form.email} onChange={change} error={errors.email} maxLength={256} required />
        <div className="sw-management__dialog-actions"><Button type="button" onClick={closeForm} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy}>{editing === 'new' ? 'Create employee' : 'Save changes'}</Button></div>
      </form>
    </Dialog>
    <ConfirmDeleteDialog item={deleting} kind="employee" busy={busy} error={deleteError} onClose={() => setDeleting(null)} onConfirm={remove} />
  </div>;
}

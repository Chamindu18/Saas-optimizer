import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, userAPI, authAPI, apiErrorMessage } from '../services/api';
import { Button } from '../components/system/Button';
import { Card } from '../components/system/Card';
import { Dialog } from '../components/system/Dialog';
import { Field } from '../components/system/Field';
import { Badge } from '../components/system/Badge';
import { ManagementTable } from '../components/system/ManagementTable';
import { formatCurrency } from '../utils/formatters';
import './ManagementPages.css';
import './AdminPage.css';

const sectionPaths = { accounts: '/admin', roles: '/role-management', audit: '/audit-log', overview: '/admin?view=overview', health: '/admin?view=health' };
const roleLabels = { admin: 'Administrator', manager: 'Manager', viewer: 'Viewer' };
const roleImpact = {
  admin: 'Administrators can manage accounts, roles, and administrative operations.',
  manager: 'Managers can manage employees, software, and license assignments.',
  viewer: 'Viewers have read access to workspace data.',
};
const roles = Object.keys(roleLabels);
const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const dateText = value => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};
const emailText = value => {
  const [local, ...domain] = String(value || '').split('@');
  return domain.length ? <>{local}@<wbr />{domain.join('@')}</> : value;
};
const errorText = error => {
  if (error.response?.status === 401) return 'Your session has expired. Sign in again.';
  if (error.response?.status === 403) return 'The server denied this action. Your administrator access may have changed.';
  if (error.response?.status === 404) return 'This account no longer exists. Refresh the directory.';
  return apiErrorMessage(error);
};

export default function AdminPage() {
  const { user: actor, updateUser } = useAuth();
  const location = useLocation();
  const section = Object.keys(sectionPaths).find(key => sectionPaths[key] === location.pathname + location.search) || 'accounts';
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [validation, setValidation] = useState({});
  const [dialogError, setDialogError] = useState('');
  const [role, setRole] = useState('viewer');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [audit, setAudit] = useState({ data: [], pagination: { page: 1, pages: 0, total: 0 } });
  const [auditPage, setAuditPage] = useState(1);
  const [auditAction, setAuditAction] = useState('');
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState('');
  const [auditRetry, setAuditRetry] = useState(0);
  const [system, setSystem] = useState({ data: null, loading: false, error: '' });
  const [systemRetry, setSystemRetry] = useState(0);
  const syncSession = async error => {
    if (error.response?.status !== 403) return;
    try { updateUser(await authAPI.me()); } catch { /* Global 401 handling owns expired sessions. */ }
  };

  const reload = async () => {
    setLoading(true); setLoadError('');
    try { setAccounts(await adminAPI.getAllUsers()); }
    catch (error) { setLoadError(apiErrorMessage(error)); await syncSession(error); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (section === 'accounts' || section === 'roles') void reload(); }, [section]);
  useEffect(() => {
    if (section !== 'overview' && section !== 'health') return;
    let active = true;
    setSystem({ data: null, loading: true, error: '' });
    (section === 'overview' ? adminAPI.getStats() : adminAPI.getSystemHealth())
      .then(data => { if (active) setSystem({ data, loading: false, error: '' }); })
      .catch(error => { if (active) { setSystem({ data: null, loading: false, error: apiErrorMessage(error) }); void syncSession(error); } });
    return () => { active = false; };
  }, [section, systemRetry]);
  useEffect(() => {
    if (section !== 'audit') return;
    let active = true;
    setAuditLoading(true); setAuditError('');
    adminAPI.getAuditLogs({ page: auditPage, limit: 20, action: auditAction || undefined })
      .then(result => { if (active) setAudit(result); })
      .catch(error => { if (active) { setAuditError(apiErrorMessage(error)); void syncSession(error); } })
      .finally(() => { if (active) setAuditLoading(false); });
    return () => { active = false; };
  }, [section, auditPage, auditAction, auditRetry]);

  const close = () => {
    if (busy) return;
    setDialog(null); setForm({ name: '', email: '', password: '' }); setValidation({}); setDialogError('');
  };
  const openForm = (type, account) => {
    setDialog({ type, account }); setForm({ name: account?.name || '', email: account?.email || '', password: '' });
    setValidation({}); setDialogError(''); setFeedback('');
  };
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!emailValid(form.email.trim())) errors.email = 'Enter a valid email address.';
    if (dialog.type === 'create' && form.password.length < 8) errors.password = 'Enter at least 8 characters.';
    setValidation(errors);
    if (Object.keys(errors).length) return;
    setBusy(true); setDialogError('');
    try {
      const result = dialog.type === 'create'
        ? await userAPI.createAccount(form.name.trim(), form.email.trim(), form.password)
        : await userAPI.updateUser(dialog.account.id, { name: form.name.trim(), email: form.email.trim() });
      setForm({ name: '', email: '', password: '' }); setDialog(null);
      setFeedback(dialog.type === 'create' ? 'Viewer account created.' : 'Account updated.');
      if (dialog.type === 'edit' && String(dialog.account.id) === String(actor?.id) && result) updateUser({ ...actor, name: result.name, email: result.email });
      await reload();
    } catch (error) {
      setForm(previous => ({ ...previous, password: '' }));
      setDialogError(errorText(error));
      await syncSession(error);
    } finally { setBusy(false); }
  };
  const remove = async () => {
    if (busy || !dialog?.account) return;
    setBusy(true); setDialogError('');
    try { await adminAPI.deleteUser(dialog.account.id); setDialog(null); setFeedback('Account deleted.'); await reload(); }
    catch (error) { setDialogError(errorText(error)); await syncSession(error); }
    finally { setBusy(false); }
  };
  const changeRole = async () => {
    if (busy || !dialog?.account || role === dialog.account.role) return;
    setBusy(true); setDialogError('');
    try { await adminAPI.updateUserRole(dialog.account.id, role); setDialog(null); setFeedback('Account role updated.'); await reload(); }
    catch (error) { setDialogError(errorText(error)); await syncSession(error); await reload(); }
    finally { setBusy(false); }
  };
  const self = row => String(row.id) === String(actor?.id);
  const lastAdmin = row => row.role === 'admin' && accounts.filter(account => account.role === 'admin').length <= 1;
  const visible = accounts.filter(row => [row.name, row.email, row.role].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const accountColumns = [
    { key: 'name', label: 'Account', className: 'sw-admin__identity', render: row => <span className="sw-admin__person"><strong>{row.name || 'Unnamed account'}{self(row) ? ' (you)' : ''}</strong><span>{emailText(row.email)}</span></span> },
    { key: 'role', label: 'Current role', render: row => <Badge tone={row.role === 'admin' ? 'warning' : 'neutral'}>{roleLabels[row.role] || row.role}</Badge> },
    { key: 'created', label: 'Created', render: row => dateText(row.created_at) },
    { key: 'actions', label: 'Actions', className: 'sw-admin__actions', render: row => <div className="sw-admin__row-actions">
      {section === 'roles' ? <Button type="button" variant="ghost" disabled={self(row) || lastAdmin(row)} aria-label={`Change role for ${row.name || row.email}`} onClick={() => { setRole(row.role); setDialogError(''); setDialog({ type: 'role', account: row }); }}>Change role</Button> : <>
        <Button type="button" variant="ghost" aria-label={`Edit ${row.name || row.email}`} onClick={() => openForm('edit', row)}>Edit</Button>
        <Button type="button" variant="ghost" disabled={self(row) || lastAdmin(row)} aria-label={`Delete ${row.name || row.email}`} onClick={() => { setDialogError(''); setDialog({ type: 'delete', account: row }); }}>Delete</Button>
      </>}
    </div> },
  ];
  const auditColumns = [
    { key: 'action', label: 'Event', render: row => row.action || 'Unspecified event' },
    { key: 'actor', label: 'Actor', render: row => <span className="sw-admin__person"><strong>{row.user_name || 'Unknown actor'}</strong>{row.user_role && <span>{roleLabels[row.user_role] || row.user_role}</span>}</span> },
    { key: 'subject', label: 'Subject', render: row => <span className="sw-admin__person"><strong>{row.target_name || 'Not recorded'}</strong>{(row.target_type || row.target_id) && <span>{[row.target_type, row.target_id].filter(Boolean).join(' #')}</span>}</span> },
    { key: 'time', label: 'Time', render: row => dateText(row.created_at) },
    { key: 'details', label: 'Details', className: 'sw-admin__details', render: row => <span className="sw-admin__person"><span>{row.details || '—'}</span>{row.ip_address && <span>IP: {row.ip_address}</span>}</span> },
  ];

  return <div className="sw-management sw-admin">
    <header className="sw-management__header"><div><p className="sw-management__eyebrow">Access control</p><h1>Administration</h1><p>Manage login accounts, privileges, and recorded administrative events.</p></div>{section === 'accounts' && <Button type="button" variant="primary" onClick={() => openForm('create')}>Create account</Button>}</header>
    <nav className="sw-admin__tabs" aria-label="Administration sections">{Object.entries({ accounts: 'Accounts', roles: 'Roles', audit: 'Audit logs', overview: 'Overview', health: 'Health checks' }).map(([key, label]) => <Link key={key} to={sectionPaths[key]} aria-current={section === key ? 'page' : undefined}>{label}</Link>)}</nav>
    {feedback && <p role="status" className="sw-management__feedback">{feedback}</p>}
    {section === 'accounts' || section === 'roles' ? <>
      <div className="sw-management__toolbar"><p aria-live="polite">{section === 'roles' ? 'Account privileges' : 'Login account directory'}{!loading && !loadError ? ` · ${visible.length} of ${accounts.length}` : ''}</p>{!loading && !loadError && accounts.length > 0 && <label className="sw-management__search">Search accounts<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, email, or role" /></label>}</div>
      {section === 'roles' && <p className="sw-admin__note">Role changes take effect on the server immediately. You cannot change your own role or demote the last administrator.</p>}
      {loadError ? <div className="sw-management__state" role="alert"><h2>Accounts could not be loaded</h2><p>{loadError}</p><Button onClick={reload}>Retry loading accounts</Button></div>
        : loading ? <div className="sw-management__state" role="status">Loading accounts…</div>
        : !accounts.length ? <div className="sw-management__state"><h2>No accounts found</h2><p>Create a viewer account to add someone to SeatWatch.</p></div>
        : !visible.length ? <div className="sw-management__state"><h2>No matching accounts</h2><p>Try a different name, email, or role.</p></div>
        : <Card className="sw-management__panel"><p className="sw-management__scroll-hint">Scroll horizontally to see all columns.</p><ManagementTable label={section === 'roles' ? 'Account roles' : 'Accounts'} columns={accountColumns} rows={visible} rowKey={row => row.id} /></Card>}
      <p className="sw-admin__note">Employees are directory records for license assignments. They do not have login accounts.</p>
    </> : section === 'audit' ? <>
      <div className="sw-management__toolbar"><p>Recorded administrative events · {audit.pagination?.total ?? 0}</p><label className="sw-management__search">Event type<select value={auditAction} onChange={event => { setAuditAction(event.target.value); setAuditPage(1); }}><option value="">All recorded events</option>{['ROLE_CHANGE', 'DELETE_USER', 'PRUNE_LICENSE', 'DELETE_LICENSE'].map(action => <option key={action} value={action}>{action.replaceAll('_', ' ')}</option>)}</select></label></div>
      <p className="sw-admin__note">Audit recording is best effort. Events may be absent if recording failed; this is not a complete or tamper-proof history.</p>
      {auditError ? <div className="sw-management__state" role="alert"><h2>Audit logs could not be loaded</h2><p>{auditError}</p><Button onClick={() => setAuditRetry(value => value + 1)}>Retry audit logs</Button></div>
        : auditLoading ? <div className="sw-management__state" role="status">Loading audit logs…</div>
        : !audit.data?.length ? <div className="sw-management__state"><h2>No recorded events</h2><p>No audit entries were returned for this page or filter.</p></div>
        : <Card className="sw-management__panel"><p className="sw-management__scroll-hint">Scroll horizontally to see all columns.</p><ManagementTable label="Audit logs" columns={auditColumns} rows={audit.data} rowKey={row => row.id} /></Card>}
      <div className="sw-admin__pagination"><Button type="button" disabled={auditLoading || auditPage <= 1} onClick={() => setAuditPage(page => page - 1)}>Previous page</Button><span aria-live="polite">Page {audit.pagination?.page || auditPage} of {audit.pagination?.pages || 1}</span><Button type="button" disabled={auditLoading || auditPage >= (audit.pagination?.pages || 0)} onClick={() => setAuditPage(page => page + 1)}>Next page</Button></div>
    </> : <>
      {system.error ? <div className="sw-management__state" role="alert"><h2>{section === 'overview' ? 'Overview' : 'Health checks'} could not be loaded</h2><p>{system.error}</p><Button onClick={() => setSystemRetry(value => value + 1)}>Retry</Button></div>
        : system.loading ? <div className="sw-management__state" role="status">Loading {section === 'overview' ? 'overview' : 'health checks'}…</div>
        : section === 'overview' ? <Card className="sw-admin__system"><h2>System overview</h2>{system.data ? <dl>
          <div><dt>Accounts</dt><dd>{system.data.totalUsers}</dd></div>
          <div><dt>Idle licenses</dt><dd>{system.data.idleLicenses}</dd></div>
          <div><dt>Licenses pruned this month</dt><dd>{system.data.licensesPrunedThisMonth}</dd></div>
          <div><dt>Monthly spend</dt><dd>{formatCurrency(system.data.totalMonthlySpend)}</dd></div>
          <div><dt>Estimated monthly savings</dt><dd>{formatCurrency(system.data.potentialSavings)}</dd></div>
          <div><dt>Recorded audit entries</dt><dd>{system.data.auditLogCount}</dd></div>
        </dl> : <p>No statistics available.</p>}</Card>
        : Array.isArray(system.data) && system.data.length ? <Card className="sw-management__panel"><ManagementTable label="Recorded health checks" columns={[
          { key: 'check_type', label: 'Check' }, { key: 'status', label: 'Status' },
          { key: 'ran_at', label: 'Checked', render: row => dateText(row.ran_at) },
        ]} rows={system.data} rowKey={row => row.id} /></Card>
        : <div className="sw-management__state"><h2>No recorded health checks</h2><p>No health check records were returned.</p></div>}
    </>}
    <Dialog open={dialog?.type === 'create' || dialog?.type === 'edit'} onOpenChange={open => { if (!open) close(); }} title={dialog?.type === 'create' ? 'Create viewer account' : `Edit ${dialog?.account?.name || 'account'}`} description={dialog?.type === 'create' ? 'The new account starts as a viewer. Supply a password to share securely with its owner.' : 'Update the account name and email address.'}>
      <form className="sw-management__form" noValidate onSubmit={save}>
        {dialogError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{dialogError}</p>}
        <Field label="Name" required value={form.name} onChange={event => setForm(previous => ({ ...previous, name: event.target.value }))} error={validation.name} autoComplete="name" />
        <Field label="Email" type="email" required value={form.email} onChange={event => setForm(previous => ({ ...previous, email: event.target.value }))} error={validation.email} autoComplete="off" />
        {dialog?.type === 'create' && <Field label="Password" type="password" required minLength={8} value={form.password} onChange={event => setForm(previous => ({ ...previous, password: event.target.value }))} error={validation.password} hint="At least 8 characters. The password is not shown again." autoComplete="new-password" />}
        <div className="sw-management__dialog-actions"><Button type="button" onClick={close} disabled={busy}>Cancel</Button><Button type="submit" variant="primary" loading={busy}>{dialog?.type === 'create' ? 'Create viewer account' : 'Save changes'}</Button></div>
      </form>
    </Dialog>
    <Dialog open={dialog?.type === 'delete'} onOpenChange={open => { if (!open) close(); }} title={`Delete ${dialog?.account?.name || 'account'}`} description={`Delete the login account for ${dialog?.account?.email || 'this person'}?`}>
      <p className="sw-management__confirm-copy">This removes access to SeatWatch. Employee records and license assignments are separate.</p>
      {dialogError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{dialogError}</p>}
      <div className="sw-management__dialog-actions"><Button onClick={close} disabled={busy}>Cancel</Button><Button variant="destructive" loading={busy} onClick={remove}>Delete account</Button></div>
    </Dialog>
    <Dialog open={dialog?.type === 'role'} onOpenChange={open => { if (!open) close(); }} title={`Change role for ${dialog?.account?.name || 'account'}`} description={`Current role: ${roleLabels[dialog?.account?.role] || ''}. Account: ${dialog?.account?.email || ''}.`}>
      <div className="sw-management__form"><label className="sw-admin__role-label" htmlFor="proposed-role">Proposed role<select id="proposed-role" value={role} onChange={event => setRole(event.target.value)}>{roles.map(value => <option key={value} value={value}>{roleLabels[value]}</option>)}</select></label>
        <p className="sw-admin__note">{roleImpact[role]}</p><p>Change <strong>{dialog?.account?.email}</strong> from <strong>{roleLabels[dialog?.account?.role]}</strong> to <strong>{roleLabels[role]}</strong>?</p>
        {dialogError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{dialogError}</p>}
        <div className="sw-management__dialog-actions"><Button onClick={close} disabled={busy}>Cancel</Button><Button variant="primary" disabled={role === dialog?.account?.role} loading={busy} onClick={changeRole}>Confirm role change</Button></div>
      </div>
    </Dialog>
    <p className="sw-admin__secondary"><Link to="/licenses">Manage licenses</Link></p>
  </div>;
}

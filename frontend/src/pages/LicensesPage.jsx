import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { licenseAPI, employeeAPI, softwareAPI, apiErrorMessage } from '../services/api';
import { useRole } from '../hooks/useRole';
import { Button } from '../components/system/Button';
import { Card } from '../components/system/Card';
import { Dialog } from '../components/system/Dialog';
import { Badge } from '../components/system/Badge';
import { ManagementTable } from '../components/system/ManagementTable';
import './ManagementPages.css';
import './LicensesPage.css';

const validId = value => /^(?:[1-9][0-9]*)$/.test(String(value)) && Number.isSafeInteger(Number(value));
const amount = value => {
  const raw = String(value ?? '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return 'Unavailable';
  const [whole, fraction = ''] = raw.split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + fraction.padEnd(2, '0');
};
const dateText = value => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
};

export default function LicensesPage() {
  const { isManager, isAdmin } = useRole();
  const { data, isLoading, error: fetchError, execute: refetch } = useAsync(licenseAPI.getAllLicenses);
  const { data: employeeData, isLoading: employeesLoading, error: employeesError, execute: reloadEmployees } = useAsync(employeeAPI.getAll);
  const { data: softwareData, isLoading: softwareLoading, error: softwareError, execute: reloadSoftware } = useAsync(softwareAPI.getAllSoftware);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignment, setAssignment] = useState({ employee_id: '', software_id: '' });
  const [assignmentErrors, setAssignmentErrors] = useState({});
  const [assignmentError, setAssignmentError] = useState('');
  const [pruning, setPruning] = useState(null);
  const [pruneError, setPruneError] = useState('');
  const [reactivating, setReactivating] = useState(null);
  const [activity, setActivity] = useState('');
  const [activityError, setActivityError] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const licenses = Array.isArray(data) ? data : [];
  const employees = Array.isArray(employeeData) ? employeeData : [];
  const software = Array.isArray(softwareData) ? softwareData : [];
  const counts = { active: 0, idle: 0, pruned: 0 };
  licenses.forEach(row => { if (Object.hasOwn(counts, row.status)) counts[row.status] += 1; });
  const visible = licenses.filter(row => (status === 'all' || row.status === status) &&
    [row.employeeName, row.employeeEmail, row.softwareName].join(' ').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const reset = () => { setSearch(''); setStatus('all'); };
  const openAssign = () => { setAssignment({ employee_id: '', software_id: '' }); setAssignmentErrors({}); setAssignmentError(''); setFeedback(''); setAssignOpen(true); };
  const assign = async event => {
    event.preventDefault();
    if (busy) return;
    const errors = {};
    if (!validId(assignment.employee_id) || !employees.some(item => String(item.id) === assignment.employee_id)) errors.employee_id = 'Select a valid employee.';
    if (!validId(assignment.software_id) || !software.some(item => String(item.id) === assignment.software_id)) errors.software_id = 'Select valid software.';
    setAssignmentErrors(errors);
    if (Object.keys(errors).length) return;
    setBusy(true); setAssignmentError('');
    try {
      await licenseAPI.assignLicense(Number(assignment.employee_id), Number(assignment.software_id));
      setAssignOpen(false); setFeedback('License assigned.'); await refetch();
    } catch (error) {
      setAssignmentError(error.response?.status === 409 ? 'This employee already has an assignment for this software, including pruned history.' : apiErrorMessage(error));
    } finally { setBusy(false); }
  };
  const prune = async () => {
    if (busy || !pruning) return;
    setBusy(true); setPruneError('');
    try { await licenseAPI.pruneLicense(pruning.id); setPruning(null); setFeedback('License pruned.'); await refetch(); }
    catch (error) { setPruneError(apiErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const reactivate = async event => {
    event.preventDefault();
    if (busy || !reactivating) return;
    const parsed = activity ? new Date(activity) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed.getTime() > Date.now()) {
      setActivityError('Enter a valid activity date and time that is not in the future.'); return;
    }
    if (parsed.getTime() <= Date.now() - 30 * 86400000) {
      setActivityError('Reactivation requires manually recorded activity within the past 30 days.'); return;
    }
    setBusy(true); setActivityError('');
    try { await licenseAPI.reactivateLicense(reactivating.id, parsed.toISOString()); setReactivating(null); setFeedback('License reactivated.'); await refetch(); }
    catch (error) { setActivityError(apiErrorMessage(error)); }
    finally { setBusy(false); }
  };
  const columns = [
    { key: 'employee', label: 'Employee', className: 'sw-licenses__person', render: row => <span className="sw-licenses__identity"><strong>{row.employeeName || 'Unknown employee'}</strong><small>{row.employeeEmail || 'Email unavailable'}</small></span> },
    { key: 'software', label: 'Software', className: 'sw-licenses__software', render: row => row.softwareName || 'Unknown software' },
    { key: 'cost', label: 'Monthly seat cost', className: 'sw-licenses__cost', render: row => amount(row.cost) },
    { key: 'status', label: 'Status', className: 'sw-licenses__status', render: row => <Badge tone={row.status === 'active' ? 'success' : row.status === 'idle' ? 'warning' : 'neutral'}>{row.status === 'active' ? 'Active' : row.status === 'idle' ? 'Idle' : row.status === 'pruned' ? 'Pruned' : 'Unknown'}</Badge> },
    { key: 'activity', label: 'Last recorded activity', className: 'sw-licenses__date', render: row => dateText(row.last_active_date ?? row.lastActivityDate) },
    { key: 'assigned', label: 'Assigned', className: 'sw-licenses__date', render: row => dateText(row.assigned_date ?? row.assignedDate) },
    ...(isAdmin ? [{ key: 'actions', label: 'Actions', className: 'sw-licenses__actions', render: row => <Button type="button" variant="ghost" disabled={busy} aria-label={(row.status === 'pruned' ? 'Reactivate ' : 'Prune ') + row.employeeName + ' — ' + row.softwareName} onClick={() => {
      setFeedback('');
      if (row.status === 'pruned') { setActivity(''); setActivityError(''); setReactivating(row); }
      else { setPruneError(''); setPruning(row); }
    }}>{row.status === 'pruned' ? 'Reactivate' : 'Prune'}</Button> }] : []),
  ];

  return <div className="sw-management sw-licenses">
    <header className="sw-management__header"><div><p className="sw-management__eyebrow">Seat management</p><h1>Licenses</h1><p>Review assigned software seats and manage their recorded lifecycle.</p></div>
      {isManager && <Button variant="primary" onClick={openAssign}>Assign License</Button>}</header>
    {feedback && <p className="sw-management__feedback" role="status">{feedback}</p>}
    {!fetchError && !isLoading && <section className="sw-licenses__summary" aria-label="License status summary">
      <div><span>Active</span><strong>{counts.active}</strong><small>Recent or unproven activity</small></div>
      <div><span>Idle</span><strong>{counts.idle}</strong><small>30 days since recorded activity</small></div>
      <div><span>Pruned</span><strong>{counts.pruned}</strong><small>Recorded as pruned in SeatWatch</small></div>
    </section>}
    <div className="sw-management__toolbar sw-licenses__toolbar"><p aria-live="polite">{fetchError || isLoading ? 'License assignments' : visible.length + ' of ' + licenses.length + ' assignments'}</p>
      {!fetchError && !isLoading && licenses.length > 0 && <div className="sw-licenses__filters">
        <label className="sw-management__search">Search licenses<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Employee or software" /></label>
        <label className="sw-management__search">Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">All</option><option value="active">Active</option><option value="idle">Idle</option><option value="pruned">Pruned</option></select></label>
        <Button type="button" variant="ghost" onClick={reset} disabled={!search && status === 'all'}>Reset filters</Button>
      </div>}</div>
    {fetchError ? <div className="sw-management__state" role="alert"><h2>Licenses could not be loaded</h2><p>{apiErrorMessage(fetchError)}</p><Button onClick={() => refetch()}>Retry loading licenses</Button></div>
      : isLoading ? <div className="sw-management__state" role="status">Loading licenses…</div>
      : !licenses.length ? <div className="sw-management__state"><h2>No licenses yet</h2><p>Assign software to an employee to begin tracking seats.</p>{isManager && <Button variant="primary" onClick={openAssign}>Assign License</Button>}</div>
      : !visible.length ? <div className="sw-management__state"><h2>No matching licenses</h2><p>Try another employee, software name, or status, or reset filters above.</p></div>
      : <Card className="sw-management__panel sw-licenses__panel"><p className="sw-management__scroll-hint">Scroll horizontally to see all columns.</p><ManagementTable label="Licenses" columns={columns} rows={visible} rowKey={row => row.id} /></Card>}
    <Dialog open={assignOpen} onOpenChange={open => { if (!open && !busy) setAssignOpen(false); }} title="Assign License" description="Assign software to an employee directory record. No login account is required.">
      <form id="license-form" noValidate onSubmit={assign} className="sw-management__form">
        {assignmentError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{assignmentError}</p>}
        {(employeesError || softwareError) && <div role="alert" className="sw-management__feedback sw-management__feedback--error">Options could not be loaded. {apiErrorMessage(employeesError || softwareError)} <Button type="button" onClick={() => { reloadEmployees(); reloadSoftware(); }}>Retry options</Button></div>}
        {!employeesLoading && !employeesError && !employees.length && <p role="status">No employees are available. Add an employee first.</p>}
        {!softwareLoading && !softwareError && !software.length && <p role="status">No software is available. Add software first.</p>}
        <label className="sw-licenses__field">Employee<select name="employee_id" aria-label="Employee" value={assignment.employee_id} disabled={employeesLoading || Boolean(employeesError) || busy} aria-invalid={Boolean(assignmentErrors.employee_id) || undefined} aria-describedby={assignmentErrors.employee_id ? 'license-employee-error' : undefined} onChange={event => { setAssignment(current => ({ ...current, employee_id: event.target.value })); setAssignmentErrors(current => ({ ...current, employee_id: '' })); }}><option value="">Select an employee</option>{employees.map(item => <option key={item.id} value={item.id}>{item.name} ({item.email})</option>)}</select>{assignmentErrors.employee_id && <span id="license-employee-error" role="alert">{assignmentErrors.employee_id}</span>}</label>
        <label className="sw-licenses__field">Software<select name="software_id" aria-label="Software" value={assignment.software_id} disabled={softwareLoading || Boolean(softwareError) || busy} aria-invalid={Boolean(assignmentErrors.software_id) || undefined} aria-describedby={assignmentErrors.software_id ? 'license-software-error' : undefined} onChange={event => { setAssignment(current => ({ ...current, software_id: event.target.value })); setAssignmentErrors(current => ({ ...current, software_id: '' })); }}><option value="">Select software</option>{software.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{assignmentErrors.software_id && <span id="license-software-error" role="alert">{assignmentErrors.software_id}</span>}</label>
        {(employeesLoading || softwareLoading) && <p role="status">Loading options…</p>}
        <div className="sw-management__dialog-actions"><Button type="button" disabled={busy} onClick={() => setAssignOpen(false)}>Cancel</Button><Button type="submit" variant="primary" loading={busy} disabled={employeesLoading || softwareLoading || Boolean(employeesError || softwareError) || !employees.length || !software.length}>Assign License</Button></div>
      </form>
    </Dialog>
    <Dialog open={Boolean(pruning)} onOpenChange={open => { if (!open && !busy) setPruning(null); }} title="Prune license" description={pruning ? 'Prune ' + pruning.softwareName + ' for ' + pruning.employeeName + '?' : undefined}>
      <p className="sw-management__confirm-copy">This changes the license status recorded in SeatWatch and keeps its assignment history. It does not cancel vendor billing or revoke provider access.</p>
      {pruneError && <p role="alert" className="sw-management__feedback sw-management__feedback--error">{pruneError}</p>}
      <div className="sw-management__dialog-actions"><Button type="button" disabled={busy} onClick={() => setPruning(null)}>Cancel</Button><Button type="button" variant="destructive" loading={busy} onClick={prune}>Prune license</Button></div>
    </Dialog>
    <Dialog open={Boolean(reactivating)} onOpenChange={open => { if (!open && !busy) setReactivating(null); }} title="Reactivate license" description={reactivating ? 'Reactivate ' + reactivating.softwareName + ' for ' + reactivating.employeeName + '.' : undefined}>
      <form noValidate onSubmit={reactivate} className="sw-management__form"><p className="sw-licenses__form-copy">Enter a manually recorded activity time within the past 30 days. SeatWatch does not verify activity with the software provider.</p>
        <label className="sw-licenses__field">Manually recorded activity date and time<input type="datetime-local" aria-label="Manually recorded activity date and time" value={activity} onChange={event => { setActivity(event.target.value); setActivityError(''); }} aria-invalid={Boolean(activityError) || undefined} aria-describedby={activityError ? 'license-activity-error' : undefined} required />{activityError && <span id="license-activity-error" role="alert">{activityError}</span>}</label>
        <div className="sw-management__dialog-actions"><Button type="button" disabled={busy} onClick={() => setReactivating(null)}>Cancel</Button><Button type="submit" variant="primary" loading={busy}>Reactivate license</Button></div>
      </form>
    </Dialog>
  </div>;
}

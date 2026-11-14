import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { adminAPI, userAPI, apiErrorMessage } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import './AdminPage.css';

export default function AdminPage() {
  const [tab, setTab] = useState('overview');
  const [account, setAccount] = useState({ name: '', email: '', password: '' });
  const [mutationError, setMutationError] = useState(null);
  const stats = useAsync(adminAPI.getStats, tab === 'overview');
  const accounts = useAsync(adminAPI.getAllUsers, tab === 'accounts');
  const licenses = useAsync(adminAPI.getAllLicenses, tab === 'licenses');
  const audit = useAsync(adminAPI.getAuditLogs, tab === 'audit');
  const health = useAsync(adminAPI.getSystemHealth, tab === 'health');
  const current = { overview: stats, accounts, licenses, audit, health }[tab];
  const createAccount = async (event) => {
    event.preventDefault();
    setMutationError(null);
    try {
      await userAPI.createAccount(account.name.trim(), account.email.trim(), account.password);
      setAccount({ name: '', email: '', password: '' });
      await accounts.execute();
    } catch (error) { setMutationError(apiErrorMessage(error)); }
  };
  const deleteAccount = async (id) => {
    if (!window.confirm('Delete this login account? Employee assignments are separate.')) return;
    setMutationError(null);
    try { await adminAPI.deleteUser(id); await accounts.execute(); }
    catch (error) { setMutationError(apiErrorMessage(error)); }
  };
  const editAccount = async (accountRow) => {
    const name = window.prompt('Account name:', accountRow.name);
    if (name === null) return;
    const email = window.prompt('Account email:', accountRow.email);
    if (email === null) return;
    setMutationError(null);
    try { await userAPI.updateUser(accountRow.id, { name: name.trim(), email: email.trim() }); await accounts.execute(); }
    catch (error) { setMutationError(apiErrorMessage(error)); }
  };

  return <div className="admin-page">
    <div className="admin-header"><h1>Admin Panel</h1><p className="admin-subtitle">Account and system administration</p></div>
    <div className="admin-tabs">{['overview', 'accounts', 'licenses', 'audit', 'health'].map(item =>
      <button key={item} className={`admin-tab ${tab === item ? 'admin-tab--active' : ''}`} onClick={() => setTab(item)}>
        {item === 'audit' ? 'Audit Logs' : item === 'health' ? 'System Health' : item[0].toUpperCase() + item.slice(1)}
      </button>)}</div>
    {current.error && <ErrorMessage message={apiErrorMessage(current.error)} />}
    {mutationError && <ErrorMessage message={mutationError} onDismiss={() => setMutationError(null)} />}
    {current.isLoading && <Spinner size="sm" />}
    {!current.isLoading && !current.error && <Card>
      {tab === 'overview' && (stats.data ? <div className="admin-overview">
        <h2>System Overview</h2>
        <p>Accounts: {stats.data.totalUsers}</p>
        <p>Idle licenses: {stats.data.idleLicenses}</p>
        <p>Pruned this month: {stats.data.licensesPrunedThisMonth}</p>
        <p>Monthly spend: {formatCurrency(stats.data.totalMonthlySpend)}</p>
        <p>Estimated monthly savings: {formatCurrency(stats.data.potentialSavings)}</p>
        <p>Audit entries: {stats.data.auditLogCount}</p>
      </div> : <p>No statistics available.</p>)}
      {tab === 'accounts' && <><h2>Accounts</h2><p><Link to="/role-management">Manage roles</Link></p>
        <form onSubmit={createAccount} aria-label="Create account">
          <input aria-label="Account name" placeholder="Name" value={account.name} required onChange={e => setAccount({ ...account, name: e.target.value })} />
          <input aria-label="Account email" placeholder="Email" type="email" value={account.email} required onChange={e => setAccount({ ...account, email: e.target.value })} />
          <input aria-label="Account password" placeholder="Password" type="password" minLength="6" value={account.password} required onChange={e => setAccount({ ...account, password: e.target.value })} />
          <button type="submit">Create viewer account</button>
        </form>
        <Table columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' },
          { key: 'role', label: 'Role' }, { key: 'created_at', label: 'Created', render: formatDate },
          { key: 'actions', label: 'Actions', render: (_, row) => <><button onClick={() => editAccount(row)}>Edit</button>
            <button onClick={() => deleteAccount(row.id)}>Delete</button></> }]}
          data={accounts.data || []} /></>}
      {tab === 'licenses' && <><h2>License Overview</h2><p><Link to="/licenses">Manage licenses</Link></p>
        <Table columns={[{ key: 'employeeName', label: 'Employee' }, { key: 'softwareName', label: 'Software' },
          { key: 'status', label: 'Status' }]} data={licenses.data || []} /></>}
      {tab === 'audit' && <><h2>Audit Logs</h2>
        <Table columns={[{ key: 'action', label: 'Action' }, { key: 'user_name', label: 'Account' },
          { key: 'target_type', label: 'Target' }, { key: 'created_at', label: 'Timestamp', render: formatDate }]}
          data={audit.data?.data || []} /></>}
      {tab === 'health' && <><h2>Recorded Health Checks</h2>
        <Table columns={[{ key: 'check_type', label: 'Check' }, { key: 'status', label: 'Status' },
          { key: 'ran_at', label: 'Checked', render: formatDate }]} data={health.data || []} /></>}
    </Card>}
  </div>;
}

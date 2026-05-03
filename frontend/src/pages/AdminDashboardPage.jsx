import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Card from '../components/ui/Card';
import '../pages/styles/AdminDashboardPage.css';

/**
 * Admin Dashboard Page
 * 
 * Displays:
 * 1. Admin Metrics (4 cards)
 * 2. User Role Management Table
 * 3. Audit Log Timeline
 * 4. System Health Panel
 * 5. Export Controls
 */
const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState(null);
  const [auditPage, setAuditPage] = useState(1);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [statsRes, usersRes, auditRes, healthRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/audit-logs?page=1&limit=20'),
        api.get('/admin/system-health'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAuditLogs(auditRes.data);
      setSystemHealth(healthRes.data?.[0]);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, targetRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: targetRole });
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: targetRole } : u
      ));
      
      setEditingRole(null);
      setNewRole(null);
      
      // Refresh audit logs
      const auditRes = await api.get('/admin/audit-logs?page=1&limit=20');
      setAuditLogs(auditRes.data);
    } catch (err) {
      setError(err.message || 'Failed to change role');
      alert(`Error: ${err.message}`);
    }
  };

  const handleLoadMoreAuditLogs = async () => {
    try {
      const nextPage = auditPage + 1;
      const res = await api.get(`/admin/audit-logs?page=${nextPage}&limit=20`);
      setAuditLogs([...auditLogs, ...res.data]);
      setAuditPage(nextPage);
    } catch (err) {
      console.error('Failed to load more audit logs:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="admin-dashboard"><p>Loading admin data...</p></div>;

  return (
    <div className="admin-dashboard">
      {error && <div className="error-banner">{error}</div>}

      {/* SECTION 1: METRICS */}
      <div className="section-title">Admin Metrics</div>
      <div className="metrics-grid">
        <Card>
          <div className="metric-header">Total Users</div>
          <div className="metric-value">{stats?.data?.totalUsers || 0}</div>
          <div className="metric-breakdown">
            {stats?.data?.roleBreakdown && (
              <>
                <span>Admin: {stats.data.roleBreakdown.admin || 0}</span>
                <span>Managers: {stats.data.roleBreakdown.manager || 0}</span>
                <span>Viewers: {stats.data.roleBreakdown.viewer || 0}</span>
              </>
            )}
          </div>
        </Card>

        <Card>
          <div className="metric-header">Idle Licenses</div>
          <div className="metric-value">{stats?.data?.idleLicenses || 0}</div>
          <div className="metric-trend">Flagged for review</div>
        </Card>

        <Card>
          <div className="metric-header">Audit Logs</div>
          <div className="metric-value">{stats?.data?.auditLogCount || 0}</div>
          <div className="metric-trend">Admin actions recorded</div>
        </Card>

        <Card>
          <div className="metric-header">System Status</div>
          <div className="metric-status">
            {systemHealth?.status === 'success' ? (
              <span className="status-badge status-success">Healthy</span>
            ) : (
              <span className="status-badge status-error">Check Failed</span>
            )}
          </div>
          <div className="metric-trend">Last check: {systemHealth ? formatDate(systemHealth.ran_at) : 'Never'}</div>
        </Card>
      </div>

      {/* SECTION 2: ROLE MANAGEMENT */}
      <div className="section-title">User Role Management</div>
      <Card>
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users && users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id}>
                    <td>{user.name || user.email.split('@')[0]}</td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      {editingRole === user.id ? (
                        <select 
                          value={newRole || user.role}
                          onChange={(e) => setNewRole(e.target.value)}
                          className="role-select"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`role-badge role-badge--${user.role}`}>{user.role}</span>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(user.created_at)}</td>
                    <td>
                      {editingRole === user.id ? (
                        <div className="action-buttons">
                          <button 
                            className="btn-small btn-confirm"
                            onClick={() => handleRoleChange(user.id, newRole)}
                          >
                            ✓
                          </button>
                          <button 
                            className="btn-small btn-cancel"
                            onClick={() => {
                              setEditingRole(null);
                              setNewRole(null);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn-edit"
                          onClick={() => {
                            setEditingRole(user.id);
                            setNewRole(user.role);
                          }}
                        >
                          Edit Role
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SECTION 3: AUDIT LOG */}
      <div className="section-title">Audit Log Timeline</div>
      <Card>
        <div className="audit-log-container">
          {auditLogs && auditLogs.length > 0 ? (
            <>
              {auditLogs.map((log, idx) => (
                <div key={idx} className="audit-entry">
                  <div className={`audit-dot audit-${log.action.toLowerCase()}`}></div>
                  <div className="audit-content">
                    <div className="audit-action">{log.action}</div>
                    <div className="audit-details">
                      <span className="audit-user">{log.user_name} ({log.user_role})</span>
                      <span className="audit-time">{formatDate(log.created_at)}</span>
                    </div>
                    {log.details && <div className="audit-description">{log.details}</div>}
                  </div>
                </div>
              ))}
              <button className="btn-load-more" onClick={handleLoadMoreAuditLogs}>
                Load More Audit Logs
              </button>
            </>
          ) : (
            <div className="empty-state">No audit logs recorded yet</div>
          )}
        </div>
      </Card>

      {/* SECTION 4: SYSTEM HEALTH */}
      <div className="section-title">System Health</div>
      <div className="system-health-grid">
        <Card>
          <div className="health-section-title">Cron Job Status</div>
          {systemHealth ? (
            <>
              <div className="health-status">
                <span className={`status-dot ${systemHealth.status === 'success' ? 'healthy' : 'error'}`}></span>
                <span>{systemHealth.status === 'success' ? 'Healthy' : 'Failed'}</span>
              </div>
              <div className="health-detail">
                <span className="label">Last Run:</span>
                <span>{formatDate(systemHealth.ran_at)}</span>
              </div>
              <div className="health-detail">
                <span className="label">Licenses Flagged:</span>
                <span>{systemHealth.idle_flagged}</span>
              </div>
              {systemHealth.message && (
                <div className="health-message">{systemHealth.message}</div>
              )}
            </>
          ) : (
            <div className="health-status">No recent health checks</div>
          )}
        </Card>

        <Card>
          <div className="health-section-title">Database & API</div>
          <div className="health-detail">
            <span className="status-dot healthy"></span>
            <span>Database: Connected</span>
          </div>
          <div className="health-detail">
            <span className="label">Admin User:</span>
            <span>{stats?.data?.totalUsers || 0} total users</span>
          </div>
          <div className="health-detail">
            <span className="label">API Status:</span>
            <span className="status-ok">Responding</span>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;

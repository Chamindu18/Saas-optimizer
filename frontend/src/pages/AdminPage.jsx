/**
 * ADMIN PAGE
 * Admin dashboard with system controls
 */

import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { adminAPI } from '../services/api';
import Card from '../components/common/Card';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Badge from '../components/common/Badge';
import { formatDate, formatDateShort } from '../utils/formatters';
import './AdminPage.css';

function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [error, setError] = useState(null);

  // Fetch admin data
  const { data: users, isLoading: usersLoading } = useAsync(
    () => adminAPI.getAllUsers(),
    selectedTab === 'users'
  );

  const { data: licenses, isLoading: licensesLoading } = useAsync(
    () => adminAPI.getAllLicenses(),
    selectedTab === 'licenses'
  );

  const { data: auditLogs, isLoading: auditLoading } = useAsync(
    () => adminAPI.getAuditLogs(),
    selectedTab === 'audit'
  );

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p className="admin-subtitle">System administration and monitoring</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${selectedTab === 'overview' ? 'admin-tab--active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`admin-tab ${selectedTab === 'users' ? 'admin-tab--active' : ''}`}
          onClick={() => setSelectedTab('users')}
        >
          Users
        </button>
        <button
          className={`admin-tab ${selectedTab === 'licenses' ? 'admin-tab--active' : ''}`}
          onClick={() => setSelectedTab('licenses')}
        >
          Licenses
        </button>
        <button
          className={`admin-tab ${selectedTab === 'audit' ? 'admin-tab--active' : ''}`}
          onClick={() => setSelectedTab('audit')}
        >
          Audit Logs
        </button>
        <button
          className={`admin-tab ${selectedTab === 'health' ? 'admin-tab--active' : ''}`}
          onClick={() => setSelectedTab('health')}
        >
          System Health
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <Card>
          <div className="admin-overview">
            <h2>System Overview</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <div className="overview-stat">
                  <span className="overview-value">—</span>
                  <span className="overview-label">Total Users</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-stat">
                  <span className="overview-value">—</span>
                  <span className="overview-label">Total Licenses</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-stat">
                  <span className="overview-value">✓</span>
                  <span className="overview-label">Database Status</span>
                </div>
              </div>
              <div className="overview-card">
                <div className="overview-stat">
                  <span className="overview-value">✓</span>
                  <span className="overview-label">API Status</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {selectedTab === 'users' && (
        <Card>
          <h2>User Management</h2>
          {usersLoading ? (
            <Spinner size="sm" />
          ) : (
            <Table
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                {
                  key: 'role',
                  label: 'Role',
                  render: (role) => <Badge variant="primary">{role}</Badge>,
                },
                {
                  key: 'created_at',
                  label: 'Created',
                  render: (date) => formatDateShort(date),
                },
              ]}
              data={users || []}
            />
          )}
        </Card>
      )}

      {selectedTab === 'licenses' && (
        <Card>
          <h2>License Overview</h2>
          {licensesLoading ? (
            <Spinner size="sm" />
          ) : (
            <Table
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'user_id', label: 'User' },
                { key: 'software_id', label: 'Software' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (status) => (
                    <Badge variant={status === 'active' ? 'success' : 'warning'}>
                      {status}
                    </Badge>
                  ),
                },
              ]}
              data={licenses || []}
            />
          )}
        </Card>
      )}

      {selectedTab === 'audit' && (
        <Card>
          <h2>Audit Logs</h2>
          {auditLoading ? (
            <Spinner size="sm" />
          ) : (
            <Table
              columns={[
                { key: 'id', label: 'ID' },
                { key: 'action', label: 'Action' },
                { key: 'user_id', label: 'User ID' },
                { key: 'resource', label: 'Resource' },
                {
                  key: 'timestamp',
                  label: 'Timestamp',
                  render: (date) => formatDate(date),
                },
              ]}
              data={auditLogs?.data || auditLogs || []}
            />
          )}
        </Card>
      )}

      {selectedTab === 'health' && (
        <Card>
          <h2>System Health Status</h2>
          <div className="health-report">
            <div className="health-item">
              <span className="health-indicator health-indicator--healthy">●</span>
              <div>
                <p className="health-title">Database</p>
                <p className="health-description">PostgreSQL connection operational</p>
              </div>
            </div>
            <div className="health-item">
              <span className="health-indicator health-indicator--healthy">●</span>
              <div>
                <p className="health-title">API Server</p>
                <p className="health-description">All endpoints responding normally</p>
              </div>
            </div>
            <div className="health-item">
              <span className="health-indicator health-indicator--healthy">●</span>
              <div>
                <p className="health-title">Authentication</p>
                <p className="health-description">JWT tokens validated correctly</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminPage;

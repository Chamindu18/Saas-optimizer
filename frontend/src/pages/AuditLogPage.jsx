import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Card from '../components/ui/Card';
import '../pages/styles/AuditLogPage.css';

/**
 * Audit Log Page
 * 
 * Displays timeline of administrative actions
 * Features:
 * - Paginated timeline (load more)
 * - Filter by action type
 * - Search by user
 * - Colored action indicators
 */
const AuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAction, setSelectedAction] = useState('');
  const [searchUser, setSearchUser] = useState('');

  const actionTypes = [
    { value: '', label: 'All Actions' },
    { value: 'ROLE_CHANGE', label: 'Role Changes' },
    { value: 'PRUNE_LICENSE', label: 'Pruned Licenses' },
    { value: 'DELETE_LICENSE', label: 'Deleted Licenses' },
    { value: 'DELETE_USER', label: 'Deleted Users' },
    { value: 'ADD_SOFTWARE', label: 'Added Software' },
    { value: 'DELETE_SOFTWARE', label: 'Deleted Software' },
  ];

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);

      const response = await adminAPI.getAuditLogs({
        page,
        limit: 20,
        action: selectedAction || undefined,
      });
      setLogs(response.data || []);
      setTotalPages(response.pagination?.pages || 1);
      setError(null);
      } catch (err) {
        setError(err.message || 'Failed to load audit logs');
        console.error('Fetch audit logs error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, selectedAction]);

  const handleLoadMore = () => {
    setPage(page + 1);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateStr);
  };

  const getActionColor = (action) => {
    const colors = {
      ROLE_CHANGE: 'gold',
      PRUNE_LICENSE: 'danger',
      DELETE_LICENSE: 'danger',
      DELETE_USER: 'danger',
      DELETE_SOFTWARE: 'danger',
      ADD_SOFTWARE: 'info',
      ASSIGN_LICENSE: 'success',
    };
    return colors[action] || 'default';
  };

  const getActionLabel = (action) => {
    const labels = {
      ROLE_CHANGE: 'Role Changed',
      PRUNE_LICENSE: 'License Pruned',
      DELETE_LICENSE: 'License Deleted',
      DELETE_USER: 'User Deleted',
      DELETE_SOFTWARE: 'Software Deleted',
      ADD_SOFTWARE: 'Software Added',
      ASSIGN_LICENSE: 'License Assigned',
    };
    return labels[action] || action;
  };

  const filteredLogs = logs.filter(log =>
    !searchUser || log.user_name.toLowerCase().includes(searchUser.toLowerCase())
  );

  if (loading && page === 1) {
    return <div className="audit-log-page"><p>Loading audit logs...</p></div>;
  }

  return (
    <div className="audit-log-page">
      <div className="page-header-section">
        <h1>Audit Log</h1>
        <p>Complete history of administrative actions and changes.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters */}
      <Card>
        <div className="filters-section">
          <div className="filter-group">
            <label>Filter by Action</label>
            <select 
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="filter-select"
            >
              {actionTypes.map(action => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Search by User</label>
            <input
              type="text"
              placeholder="Admin email..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </Card>

      {/* Audit Log Timeline */}
      <Card>
        <div className="audit-timeline">
          {filteredLogs && filteredLogs.length > 0 ? (
            <>
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="audit-entry">
                  <div className={`audit-dot audit-${getActionColor(log.action)}`}></div>
                  
                  <div className="audit-content">
                    <div className="audit-header">
                      <span className="audit-action">{getActionLabel(log.action)}</span>
                      <span className="audit-time" title={formatDate(log.created_at)}>
                        {getRelativeTime(log.created_at)}
                      </span>
                    </div>
                    
                    <div className="audit-meta">
                      <span className={`audit-role audit-role--${log.user_role}`}>
                        {log.user_role}
                      </span>
                      <span className="audit-user">{log.user_name}</span>
                    </div>

                    {log.target_name && (
                      <div className="audit-target">
                        Target: <strong>{log.target_name}</strong>
                      </div>
                    )}

                    {log.details && (
                      <div className="audit-details">{log.details}</div>
                    )}
                  </div>
                </div>
              ))}

              {page < totalPages && (
                <div className="load-more-container">
                  <button 
                    className="btn-load-more"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More Audit Logs'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              {searchUser ? 'No matching audit logs found.' : 'No audit logs recorded yet.'}
            </div>
          )}
        </div>
      </Card>

      {/* Legend */}
      <Card>
        <div className="legend-section">
          <h3>Action Color Legend</h3>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-dot legend-gold"></span>
              <span>Role Change</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-danger"></span>
              <span>Deletion / Pruning</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-info"></span>
              <span>Addition</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-success"></span>
              <span>Assignment</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogPage;

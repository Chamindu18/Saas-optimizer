import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import Card from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../services/api';
import '../pages/styles/RoleManagementPage.css';

/**
 * Role Management Page
 * 
 * Displays a full user table with inline role editing
 * Features:
 * - Optimistic updates (immediate UI feedback)
 * - Cannot change own role
 * - Last admin protection
 * - Confirmation modal for changes
 */
const RoleManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { user: currentUser } = useAuth();
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    fetchUsers();
    
    // Get current user ID from token
    if (currentUser) {
      setCurrentUserId(currentUser.id || null);
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersResponse = await adminAPI.getAllUsers();
      setUsers(usersResponse || []);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChangeClick = (user) => {
    // Prevent editing own role
    if (user.id === currentUserId) {
      alert('You cannot change your own role. Ask another admin to change it.');
      return;
    }

    setEditingRole(user.id);
    setNewRole(user.role);
  };

  const handleConfirmChange = (user, targetRole) => {
    // Check if demoting last admin
    if (user.role === 'admin' && targetRole !== 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        alert('Cannot demote the last admin. There must always be at least one admin.');
        setEditingRole(null);
        setNewRole(null);
        return;
      }
    }

    setConfirmDialog({
      user,
      oldRole: user.role,
      newRole: targetRole,
    });
  };

  const handleConfirmSubmit = async () => {
    const { user, oldRole, newRole } = confirmDialog;

    try {
      // Optimistic update
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, role: newRole } : u
      ));

      // API call
      await adminAPI.updateUserRole(user.id, newRole);

      setConfirmDialog(null);
      setEditingRole(null);
      setNewRole(null);
    } catch (err) {
      // Revert optimistic update
      setUsers(users.map(u => 
        u.id === user.id ? { ...u, role: oldRole } : u
      ));
      setError(apiErrorMessage(err));
    }
  };

  const handleCancel = () => {
    setEditingRole(null);
    setNewRole(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleDescription = (role) => {
    const descriptions = {
      admin: 'Full access — can manage users, prune licenses, and view all reports',
      manager: 'Can add employees and assign licenses',
      viewer: 'Read-only access to all dashboards and reports',
    };
    return descriptions[role] || '';
  };

  if (loading) {
    return <div className="role-management"><p>Loading users...</p></div>;
  }

  return (
    <div className="role-management">
      <div className="page-header-section">
        <h1>Role Management</h1>
        <p>Manage user roles and access permissions. Changes take effect immediately.</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <Card>
        <div className="users-table-wrapper">
          <table className="role-table">
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
                  <tr key={user.id} className={user.id === currentUserId ? 'current-user' : ''}>
                    <td className="user-name-cell">
                      {user.name || user.email.split('@')[0]}
                      {user.id === currentUserId && <span className="you-badge">(You)</span>}
                    </td>
                    <td className="email-cell">{user.email}</td>
                    <td>
                      {editingRole === user.id ? (
                        <div className="role-editor">
                          <select 
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="role-dropdown"
                          >
                            <option value="admin">Admin</option>
                            <option value="manager">Manager</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <p className="role-description">{getRoleDescription(newRole)}</p>
                        </div>
                      ) : (
                        <span className={`role-badge role-badge--${user.role}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="date-cell">{formatDate(user.created_at)}</td>
                    <td>
                      {editingRole === user.id ? (
                        <div className="action-buttons">
                          <button 
                            className="btn-save"
                            onClick={() => handleConfirmChange(user, newRole)}
                          >
                            Save
                          </button>
                          <button 
                            className="btn-cancel-action"
                            onClick={handleCancel}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          className={`btn-change-role ${user.id === currentUserId ? 'disabled' : ''}`}
                          onClick={() => handleRoleChangeClick(user)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? 'You cannot change your own role' : 'Change user role'}
                        >
                          Change Role
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

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Role Change</h2>
            </div>
            <div className="modal-body">
              <p>
                Change <strong>{confirmDialog.user.email}</strong> from{' '}
                <span className={`role-badge role-badge--${confirmDialog.oldRole}`}>
                  {confirmDialog.oldRole}
                </span>
                {' '}to{' '}
                <span className={`role-badge role-badge--${confirmDialog.newRole}`}>
                  {confirmDialog.newRole}
                </span>
                ?
              </p>
              <p className="modal-description">
                {getRoleDescription(confirmDialog.newRole)}
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel-modal" onClick={() => setConfirmDialog(null)}>
                Cancel
              </button>
              <button className="btn-confirm-modal" onClick={handleConfirmSubmit}>
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementPage;

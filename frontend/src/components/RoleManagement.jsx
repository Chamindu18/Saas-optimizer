import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useRole } from '../hooks/useRole';

/**
 * Role Management Page
 * 
 * Admin-only page to view all users and manage their roles.
 * Features:
 * - View all users with their current roles
 * - Change any user's role (except own account)
 * - Confirmation modal before changing roles
 * - Role badges showing current role
 * - Protection against demoting last admin
 */
function RoleManagement() {
  const navigate = useNavigate();
  const { isAdmin, role: currentUserRole } = useRole();

  // State for users list
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for role change confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({
    userId: null,
    userName: '',
    currentRole: '',
    newRole: '',
  });

  // Redirect non-admins away from this page
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Fetch all users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        setUsers(response.data.data || []);
        setError(null);
      } catch (err) {
        setError(`Failed to load users: ${err.message}`);
        console.error('Users API error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Handle role change dropdown click
  const handleRoleChange = (user, newRole) => {
    if (newRole === user.role) return; // No change

    setConfirmData({
      userId: user.id,
      userName: user.name,
      currentRole: user.role,
      newRole: newRole,
    });
    setShowConfirmModal(true);
  };

  // Confirm role change via API
  const confirmRoleChange = async () => {
    try {
      const response = await api.patch(`/users/${confirmData.userId}/role`, {
        role: confirmData.newRole,
      });

      // Update local state with new role
      setUsers(
        users.map((u) =>
          u.id === confirmData.userId ? { ...u, role: confirmData.newRole } : u
        )
      );

      setShowConfirmModal(false);
      setConfirmData({
        userId: null,
        userName: '',
        currentRole: '',
        newRole: '',
      });
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || `Failed to update role: ${err.message}`;
      setError(errorMsg);
      setShowConfirmModal(false);
    }
  };

  // Get role badge styling
  const getRoleBadgeStyle = (role) => {
    const baseStyle = {
      display: 'inline-block',
      fontSize: '11px',
      padding: '4px 10px',
      borderRadius: '16px',
      border: '1px solid',
      fontWeight: '600',
    };

    switch (role) {
      case 'admin':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(201, 168, 76, 0.15)',
          color: '#C9A84C',
          borderColor: 'rgba(201, 168, 76, 0.25)',
        };
      case 'manager':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(74, 110, 140, 0.15)',
          color: '#7AAAC4',
          borderColor: 'rgba(74, 110, 140, 0.25)',
        };
      case 'viewer':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(107, 99, 85, 0.15)',
          color: '#A09880',
          borderColor: 'rgba(107, 99, 85, 0.25)',
        };
    }
  };

  if (loading) {
    return (
      <div style={pageStyles.container}>
        <div style={pageStyles.loadingText}>Loading users...</div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Page Header */}
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>Role Management</h1>
        <p style={pageStyles.subtitle}>
          Control who can access what. Be careful — only admins can prune
          licenses and manage software.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div style={pageStyles.alert}>
          <p style={{ margin: 0 }}>⚠️ {error}</p>
        </div>
      )}

      {/* Users Table Card */}
      <div style={pageStyles.card}>
        {users.length > 0 ? (
          <div style={pageStyles.tableWrapper}>
            <table style={pageStyles.table}>
              <thead>
                <tr style={pageStyles.tableHeaderRow}>
                  <th style={{ ...pageStyles.tableHeader, width: '25%' }}>
                    Name
                  </th>
                  <th style={{ ...pageStyles.tableHeader, width: '30%' }}>
                    Email
                  </th>
                  <th style={{ ...pageStyles.tableHeader, width: '15%' }}>
                    Current Role
                  </th>
                  <th style={{ ...pageStyles.tableHeader, width: '30%' }}>
                    Change Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      ...pageStyles.tableRow,
                      backgroundColor:
                        index % 2 === 0 ? '#ffffff' : '#fafbfc',
                    }}
                  >
                    {/* User Name */}
                    <td style={pageStyles.tableCell}>
                      {user.name}
                      {/* "You" badge for current user */}
                      {user.id === parseInt(
                        localStorage.getItem('seatwatch_user_id') || '-1'
                      ) && (
                        <span
                          style={{
                            marginLeft: '8px',
                            fontSize: '10px',
                            color: '#666',
                            fontStyle: 'italic',
                          }}
                        >
                          (You)
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td style={pageStyles.tableCell}>{user.email}</td>

                    {/* Current Role Badge */}
                    <td style={pageStyles.tableCell}>
                      <span style={getRoleBadgeStyle(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>

                    {/* Role Change Dropdown */}
                    <td style={pageStyles.tableCell}>
                      <select
                        style={{
                          ...pageStyles.roleSelect,
                          // Disable the dropdown if it's the current user
                          opacity:
                            user.id ===
                            parseInt(
                              localStorage.getItem('seatwatch_user_id') || '-1'
                            )
                              ? 0.5
                              : 1,
                          pointerEvents:
                            user.id ===
                            parseInt(
                              localStorage.getItem('seatwatch_user_id') || '-1'
                            )
                              ? 'none'
                              : 'auto',
                          cursor:
                            user.id ===
                            parseInt(
                              localStorage.getItem('seatwatch_user_id') || '-1'
                            )
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        disabled={
                          user.id ===
                          parseInt(
                            localStorage.getItem('seatwatch_user_id') || '-1'
                          )
                        }
                        title={
                          user.id ===
                          parseInt(
                            localStorage.getItem('seatwatch_user_id') || '-1'
                          )
                            ? "You can't change your own role"
                            : ''
                        }
                      >
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={pageStyles.emptyMessage}>No users found.</p>
        )}
      </div>

      {/* User count */}
      {users.length > 0 && (
        <p style={pageStyles.userCount}>
          Total users: <strong>{users.length}</strong>
        </p>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={pageStyles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div
            style={pageStyles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={pageStyles.modalTitle}>Confirm Role Change</h3>
            <p style={pageStyles.modalText}>
              Change <strong>{confirmData.userName}</strong>'s role from{' '}
              <span style={getRoleBadgeStyle(confirmData.currentRole)}>
                {confirmData.currentRole.charAt(0).toUpperCase() +
                  confirmData.currentRole.slice(1)}
              </span>{' '}
              to{' '}
              <span style={getRoleBadgeStyle(confirmData.newRole)}>
                {confirmData.newRole.charAt(0).toUpperCase() +
                  confirmData.newRole.slice(1)}
              </span>
              ?
            </p>
            <div style={pageStyles.modalButtonGroup}>
              <button
                style={pageStyles.cancelButton}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                style={pageStyles.confirmButton}
                onClick={confirmRoleChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Page styling
const pageStyles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: '#f8fafc',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0',
  },
  alert: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '24px',
    color: '#92400e',
    fontSize: '14px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeaderRow: {
    borderBottom: '2px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#64748b',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
  },
  tableCell: {
    padding: '12px 16px',
    color: '#1e293b',
    verticalAlign: 'middle',
  },
  roleSelect: {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    fontSize: '13px',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '24px',
  },
  userCount: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'right',
  },
  loadingText: {
    textAlign: 'center',
    color: '#64748b',
    padding: '32px',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 12px 0',
  },
  modalText: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 24px 0',
    lineHeight: '1.5',
  },
  modalButtonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  confirmButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default RoleManagement;

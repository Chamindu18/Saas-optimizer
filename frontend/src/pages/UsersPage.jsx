/**
 * USERS PAGE
 * User management with CRUD operations
 */

import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useForm } from '../hooks/useForm';
import { userAPI } from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import Badge from '../components/common/Badge';
import { formatDate, isValidEmail, getRoleDisplayName, getRoleColor } from '../utils/formatters';
import './ManagementPages.css';

function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);

  // Fetch users
  const { data: users, isLoading, error: fetchError, execute: refetch } = useAsync(
    () => userAPI.getAllUsers(),
    true
  );

  // Form validation
  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    else if (!isValidEmail(values.email)) errors.email = 'Invalid email';
    return errors;
  };

  // Form hook
  const form = useForm(
    editingUser || { name: '', email: '', role: 'user' },
    async (values) => {
      try {
        if (editingUser) {
          await userAPI.updateUser(editingUser.id, values);
        } else {
          await userAPI.createUser(values.name, values.email);
        }
        setShowModal(false);
        setEditingUser(null);
        refetch();
      } catch (err) {
        setError(err.message);
      }
    },
    validate
  );

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        refetch();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const openModal = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldValue('name', user.name);
      form.setFieldValue('email', user.email);
      form.setFieldValue('role', user.role || 'user');
    } else {
      form.reset();
    }
    setShowModal(true);
  };

  if (isLoading) return <Spinner text="Loading users..." />;

  return (
    <div className="management-page">
      <div className="management-header">
        <h1>Users</h1>
        <Button onClick={() => openModal()}>Add User</Button>
      </div>

      {(error || fetchError) && (
        <ErrorMessage message={error || fetchError?.message} onDismiss={() => setError(null)} />
      )}

      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            {
              key: 'role',
              label: 'Role',
              render: (role) => (
                <Badge variant="primary" style={{ color: getRoleColor(role) }}>
                  {getRoleDisplayName(role)}
                </Badge>
              ),
            },
            {
              key: 'created_at',
              label: 'Created',
              render: (date) => formatDate(date),
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (_, row) => (
                <div className="table-actions">
                  <Button variant="ghost" size="sm" onClick={() => openModal(row)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={users || []}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
        onClose={() => setShowModal(false)}
        size="md"
        actions={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" loading={form.isSubmitting}>
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </div>
        }
      >
        <form id="user-form" onSubmit={form.handleSubmit}>
          <Input
            label="Name"
            type="text"
            name="name"
            value={form.values.name}
            onChange={form.handleChange}
            error={form.touched.name ? form.errors.name : null}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={form.values.email}
            onChange={form.handleChange}
            error={form.touched.email ? form.errors.email : null}
            required
          />
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select
              id="role"
              name="role"
              value={form.values.role}
              onChange={form.handleChange}
              className="form-select"
            >
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default UsersPage;

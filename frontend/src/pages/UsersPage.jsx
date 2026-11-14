/**
 * EMPLOYEES PAGE
 * License assignees without application credentials
 */

import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useForm } from '../hooks/useForm';
import { employeeAPI } from '../services/api';
import { useRole } from '../hooks/useRole';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatDate, isValidEmail } from '../utils/formatters';
import './ManagementPages.css';

function UsersPage() {
  const { isManager } = useRole();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);

  // Fetch users
  const { data: users, isLoading, error: fetchError, execute: refetch } = useAsync(
    () => employeeAPI.getAll(),
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
    editingUser || { name: '', email: '' },
    async (values) => {
      try {
        if (editingUser) {
          await employeeAPI.update(editingUser.id, values.name, values.email);
        } else {
          await employeeAPI.create(values.name, values.email);
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
        await employeeAPI.remove(userId);
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
    } else {
      form.reset();
    }
    setShowModal(true);
  };

  if (isLoading) return <Spinner text="Loading employees..." />;

  return (
    <div className="management-page">
      <div className="management-header">
        <h1>Employees</h1>
        {isManager && <Button onClick={() => openModal()}>Add Employee</Button>}
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
              key: 'created_at',
              label: 'Created',
              render: (date) => formatDate(date),
            },
            ...(isManager ? [{
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
            }] : []),
          ]}
          data={users || []}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        title={editingUser ? 'Edit Employee' : 'Add Employee'}
        onClose={() => setShowModal(false)}
        size="md"
        actions={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" loading={form.isSubmitting}>
              {editingUser ? 'Update' : 'Create'} Employee
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
        </form>
      </Modal>
    </div>
  );
}

export default UsersPage;

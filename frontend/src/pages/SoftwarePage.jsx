/**
 * SOFTWARE PAGE
 * Software/subscription management
 */

import React, { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { useForm } from '../hooks/useForm';
import { softwareAPI } from '../services/api';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Table from '../components/common/Table';
import Spinner from '../components/common/Spinner';
import ErrorMessage from '../components/common/ErrorMessage';
import { formatCurrency } from '../utils/formatters';
import './ManagementPages.css';

function SoftwarePage() {
  const [showModal, setShowModal] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState(null);
  const [error, setError] = useState(null);

  const { data: software, isLoading, error: fetchError, execute: refetch } = useAsync(
    () => softwareAPI.getAllSoftware(),
    true
  );

  const validate = (values) => {
    const errors = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.category) errors.category = 'Category is required';
    if (!values.price_per_seat) errors.price_per_seat = 'Price is required';
    else if (isNaN(values.price_per_seat)) errors.price_per_seat = 'Must be a number';
    return errors;
  };

  const form = useForm(
    editingSoftware || { name: '', category: '', price_per_seat: '' },
    async (values) => {
      try {
        const formData = {
          ...values,
          price_per_seat: parseFloat(values.price_per_seat),
        };
        if (editingSoftware) {
          await softwareAPI.updateSoftware(editingSoftware.id, formData);
        } else {
          await softwareAPI.createSoftware(formData.name, formData.category, formData.price_per_seat);
        }
        setShowModal(false);
        setEditingSoftware(null);
        refetch();
      } catch (err) {
        setError(err.message);
      }
    },
    validate
  );

  const handleDelete = async (id) => {
    if (window.confirm('Delete this software?')) {
      try {
        await softwareAPI.deleteSoftware(id);
        refetch();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const openModal = (item = null) => {
    setEditingSoftware(item);
    if (item) {
      form.setFieldValue('name', item.name);
      form.setFieldValue('category', item.category);
      form.setFieldValue('price_per_seat', item.price_per_seat);
    } else {
      form.reset();
    }
    setShowModal(true);
  };

  if (isLoading) return <Spinner text="Loading software..." />;

  return (
    <div className="management-page">
      <div className="management-header">
        <h1>Software & Subscriptions</h1>
        <Button onClick={() => openModal()}>Add Software</Button>
      </div>

      {(error || fetchError) && (
        <ErrorMessage message={error || fetchError?.message} onDismiss={() => setError(null)} />
      )}

      <Card>
        <Table
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category' },
            {
              key: 'price_per_seat',
              label: 'Price/Seat',
              render: (price) => formatCurrency(price),
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
          data={software || []}
        />
      </Card>

      <Modal
        isOpen={showModal}
        title={editingSoftware ? 'Edit Software' : 'Add Software'}
        onClose={() => setShowModal(false)}
        size="md"
        actions={
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="software-form" loading={form.isSubmitting}>
              {editingSoftware ? 'Update' : 'Create'} Software
            </Button>
          </div>
        }
      >
        <form id="software-form" onSubmit={form.handleSubmit}>
          <Input
            label="Software Name"
            type="text"
            name="name"
            value={form.values.name}
            onChange={form.handleChange}
            error={form.touched.name ? form.errors.name : null}
            required
          />
          <Input
            label="Category"
            type="text"
            name="category"
            placeholder="e.g., Development, Design, Marketing"
            value={form.values.category}
            onChange={form.handleChange}
            error={form.touched.category ? form.errors.category : null}
            required
          />
          <Input
            label="Price Per Seat/Month ($)"
            type="number"
            name="price_per_seat"
            placeholder="99.99"
            step="0.01"
            value={form.values.price_per_seat}
            onChange={form.handleChange}
            error={form.touched.price_per_seat ? form.errors.price_per_seat : null}
            required
          />
        </form>
      </Modal>
    </div>
  );
}

export default SoftwarePage;

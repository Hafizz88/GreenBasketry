import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Helper for getting auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

const ManageCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_percent: '',
    valid_from: '',
    valid_to: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all coupons
  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/admin/coupons', getAuthHeader());
      setCoupons(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('currently there is no coupon');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      ...form,
      discount_percent: parseFloat(form.discount_percent),
      is_active: true
    };

    try {
      if (editingId) {
        // Update existing coupon
        await axios.put(
          `http://localhost:5000/api/admin/coupons/${editingId}`,
          body,
          getAuthHeader()
        );
      } else {
        // Create new coupon
        await axios.post('http://localhost:5000/api/admin/create-coupon', body, getAuthHeader());
      }

      await fetchCoupons();
      resetForm();
    } catch (err) {
      alert('Error saving coupon');
      console.error(err);
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_percent: '',
      valid_from: '',
      valid_to: ''
    });
    setEditingId(null);
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description,
      discount_percent: coupon.discount_percent,
      valid_from: coupon.valid_from.slice(0, 10),
      valid_to: coupon.valid_to.slice(0, 10)
    });
    setEditingId(coupon.coupon_id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/coupons/${id}`, getAuthHeader());
      await fetchCoupons();
    } catch (err) {
      alert('Failed to delete coupon');
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <h2>Manage Coupons</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="code"
          placeholder="Code"
          value={form.code}
          onChange={handleChange}
          required
        />
        <input
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="discount_percent"
          type="number"
          placeholder="Discount %"
          value={form.discount_percent}
          onChange={handleChange}
          required
        />
        <input
          name="valid_from"
          type="date"
          value={form.valid_from}
          onChange={handleChange}
          required
        />
        <input
          name="valid_to"
          type="date"
          value={form.valid_to}
          onChange={handleChange}
          required
        />
        <button type="submit">
          {editingId ? 'Update Coupon' : 'Add Coupon'}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm}>Cancel</button>
        )}
      </form>

      <hr />

      {loading ? (
        <p>Loading coupons...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : coupons.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          No coupons available right now. Create your first coupon using the form above.
        </p>
      ) : (
        <table border="1" cellPadding="8" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Discount %</th>
              <th>Valid From</th>
              <th>Valid To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.coupon_id}>
                <td>{coupon.code}</td>
                <td>{coupon.description}</td>
                <td>{coupon.discount_percent}</td>
                <td>{coupon.valid_from.slice(0, 10)}</td>
                <td>{coupon.valid_to.slice(0, 10)}</td>
                <td>
                  <button onClick={() => handleEdit(coupon)}>Edit</button>
                  <button onClick={() => handleDelete(coupon.coupon_id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ManageCoupons;
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Coupon {
  coupon_id: number;
  code: string;
  description: string;
  discount_percent: number;
  valid_from: string;
  valid_to: string;
  required_point: number;
}

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const ManageCoupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_percent: '',
    valid_from: '',
    valid_to: '',
    required_point: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      // For admin panel, fetch all coupons without customer_id filter
      const res = await axios.get('http://localhost:5001/api/admin/coupons', getAuthHeader());
      setCoupons(res.data);
      setError('');
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setError('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      ...form,
      discount_percent: parseFloat(form.discount_percent),
      required_point: parseInt(form.required_point, 10) || 0,
      is_active: true,
    };
    try {
      if (editingId) {
        await axios.put(
          `http://localhost:5001/api/admin/coupons/${editingId}`,
          body,
          getAuthHeader()
        );
      } else {
        await axios.post('http://localhost:5001/api/admin/create-coupon', body, getAuthHeader());
      }
      await fetchCoupons();
      resetForm();
    } catch (err) {
      alert('Error saving coupon');
    }
  };

  const resetForm = () => {
    setForm({
      code: '',
      description: '',
      discount_percent: '',
      valid_from: '',
      valid_to: '',
      required_point: '',
    });
    setEditingId(null);
  };

  const handleEdit = (coupon: Coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description,
      discount_percent: coupon.discount_percent.toString(),
      valid_from: coupon.valid_from.slice(0, 10),
      valid_to: coupon.valid_to.slice(0, 10),
      required_point: coupon.required_point?.toString() || '',
    });
    setEditingId(coupon.coupon_id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await axios.delete(`http://localhost:5001/api/admin/coupons/${id}`, getAuthHeader());
      await fetchCoupons();
    } catch (err) {
      alert('Failed to delete coupon');
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto' }}>
      <h2>Manage Coupons</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input name="code" placeholder="Code" value={form.code} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={form.description} onChange={handleChange} required />
        <input name="discount_percent" type="number" placeholder="Discount %" value={form.discount_percent} onChange={handleChange} required />
        <input name="valid_from" type="date" value={form.valid_from} onChange={handleChange} required />
        <input name="valid_to" type="date" value={form.valid_to} onChange={handleChange} required />
        <input name="required_point" type="number" placeholder="Required Points" value={form.required_point} onChange={handleChange} min={0} />
        <button type="submit">{editingId ? 'Update Coupon' : 'Add Coupon'}</button>
        {editingId && <button type="button" onClick={resetForm}>Cancel</button>}
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
        <table border={1} cellPadding={8} style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Discount %</th>
              <th>Valid From</th>
              <th>Valid To</th>
              <th>Required Points</th>
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
                <td>{coupon.required_point}</td>
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
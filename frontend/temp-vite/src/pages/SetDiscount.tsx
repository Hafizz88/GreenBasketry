import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Product {
  product_id: number;
  name: string;
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

const SetDiscount: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [discount, setDiscount] = useState('');
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/products', getAuthHeader());
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      await axios.put(
        `http://localhost:5001/api/admin/products/${selectedProduct}/discount`,
        {
          discount_percentage: parseFloat(discount),
          discount_started: discountStart,
          discount_finished: discountEnd
        },
        getAuthHeader()
      );
      setSuccess('Discount set successfully!');
      setDiscount('');
      setSelectedProduct('');
    } catch (err) {
      setError('Failed to set discount');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: 'auto' }}>
      <h2>Set Product Discount</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} required>
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p.product_id} value={p.product_id}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Discount Percent"
          value={discount}
          onChange={e => setDiscount(e.target.value)}
          min={0}
          max={100}
          required
        />
        <input
          type="date"
          value={discountStart}
          onChange={e => setDiscountStart(e.target.value)}
          required
          placeholder="Discount Start Date"
        />
        <input
          type="date"
          value={discountEnd}
          onChange={e => setDiscountEnd(e.target.value)}
          required
          placeholder="Discount End Date"
        />
        <button type="submit" disabled={loading || !selectedProduct || !discount || !discountStart || !discountEnd}>{loading ? 'Setting...' : 'Set Discount'}</button>
      </form>
      {success && <p style={{ color: 'green' }}>{success}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default SetDiscount; 
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

interface Product {
  product_id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  image_url?: string;
  discount_percentage?: number;
  vat_percentage?: number;
  created_at?: string;
  last_updated?: string;
  reviews?: any[];
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_ENDPOINTS.PRODUCTS}/${id}`);
        setProduct(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch product details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  if (!product) return null;

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 16 }}>{product.name}</h2>
      {product.image_url && (
        <img src={product.image_url} alt={product.name} style={{ maxWidth: 300, borderRadius: 8, marginBottom: 16 }} />
      )}
      <p><strong>Category:</strong> {product.category}</p>
      <p><strong>Price:</strong> ৳{product.price}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      {product.discount_percentage && <p><strong>Discount:</strong> {product.discount_percentage}%</p>}
      {product.vat_percentage && <p><strong>VAT:</strong> {product.vat_percentage}%</p>}
      <p><strong>Description:</strong> {product.description}</p>
      <p><strong>Created At:</strong> {product.created_at}</p>
      <p><strong>Last Updated:</strong> {product.last_updated}</p>
      <hr style={{ margin: '24px 0' }} />
      <h3>Reviews (Coming Soon)</h3>
      <div style={{ color: '#888' }}>
        {/* Placeholder for reviews */}
        No reviews yet.
      </div>
    </div>
  );
};

export default ProductDetails; 
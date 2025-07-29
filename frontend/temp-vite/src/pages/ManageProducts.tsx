import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  points_rewarded?: number;
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

const ManageProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5001/api/admin/products', getAuthHeader());
      setProducts(res.data);
    } catch (err) {
      alert('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;
    try {
      await axios.delete(`http://localhost:5001/api/admin/products/${productId}`, getAuthHeader());
      setProducts(products.filter(p => p.product_id !== productId));
      alert('✅ Product deleted successfully');
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: 'auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Manage Products</h2>
        <button 
          onClick={fetchProducts}
          style={{ 
            padding: '8px 16px', 
            background: '#00796b', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer' 
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No products found.</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {products.map(prod => (
            <div key={prod.product_id} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '12px', 
              padding: '20px', 
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
            >
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  flexShrink: 0,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {prod.image_url ? (
                    <img 
                      src={prod.image_url} 
                      alt={prod.name} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }} 
                    />
                  ) : (
                    <span style={{ color: '#999', fontSize: '12px' }}>No Image</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#333' }}>
                    {prod.name}
                  </h3>
                  <p style={{ 
                    margin: '0 0 4px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    background: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    display: 'inline-block'
                  }}>
                    {prod.category}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                {prod.description && (
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '14px', 
                    color: '#666',
                    lineHeight: '1.4',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {prod.description}
                  </p>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: '#00796b' }}>
                      ৳{prod.price}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                      Stock: {prod.stock}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4caf50' }}>
                      🎁 {prod.points_rewarded || 0} points
                    </p>
                  </div>
                  
                  {(prod.discount_percentage || prod.vat_percentage) && (
                    <div style={{ textAlign: 'right' }}>
                      {prod.discount_percentage && (
                        <p style={{ margin: '0', fontSize: '12px', color: '#e91e63' }}>
                          -{prod.discount_percentage}% off
                        </p>
                      )}
                      {prod.vat_percentage && (
                        <p style={{ margin: '0', fontSize: '12px', color: '#ff9800' }}>
                          +{prod.vat_percentage}% VAT
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => handleRemove(prod.product_id)}
                  style={{ 
                    flex: 1,
                    padding: '8px 16px', 
                    background: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  🗑️ Delete
                </button>
                <button 
                  onClick={() => navigate(`/admin/products/${prod.product_id}/edit`)}
                  style={{ 
                    flex: 1,
                    padding: '8px 16px', 
                    background: '#2196f3', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageProducts; 
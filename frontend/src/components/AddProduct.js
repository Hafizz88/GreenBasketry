import React, { useState } from 'react';
import axios from 'axios';

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Not authenticated. Please log in.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  };
};

function AddProduct() {
  const [product, setProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    discount_percentage: '',
    vat_percentage: ''
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Update input values
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPG, PNG, GIF)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedImage) {
      setError('Please select an image for the product');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('category', product.category);
      formData.append('price', product.price);
      formData.append('stock', product.stock);
      formData.append('description', product.description);
      formData.append('discount_percentage', product.discount_percentage);
      formData.append('vat_percentage', product.vat_percentage);
      formData.append('image', selectedImage);

      const res = await axios.post(
        'http://localhost:5001/api/admin/add-product',
        formData,
        { headers: getAuthHeader() }
      );

      alert('✅ Product added successfully!');
      setProduct({ // Reset form
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        discount_percentage: '',
        vat_percentage: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('image-input');
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || '❌ Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Add New Product
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Name *</label>
          <input 
            name="name" 
            placeholder="Enter product name" 
            value={product.name} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Category *</label>
          <input 
            name="category" 
            placeholder="Enter category (e.g., Electronics, Clothing)" 
            value={product.category} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Price *</label>
            <input 
              name="price" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={product.price} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Stock *</label>
            <input 
              name="stock" 
              type="number" 
              placeholder="0" 
              value={product.stock} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Description *</label>
          <textarea 
            name="description" 
            placeholder="Enter product description" 
            value={product.description} 
            onChange={handleChange} 
            required 
            rows={4}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Discount %</label>
            <input 
              name="discount_percentage" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={product.discount_percentage} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>VAT %</label>
            <input 
              name="vat_percentage" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={product.vat_percentage} 
              onChange={handleChange} 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Product Image *</label>
          <input 
            id="image-input"
            name="image" 
            type="file" 
            accept="image/*"
            onChange={handleImageChange} 
            required 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          />
          <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Supported formats: JPG, PNG, GIF. Max size: 5MB
          </p>
        </div>

        {imagePreview && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Image Preview:</label>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                borderRadius: '8px', 
                border: '2px solid #ddd',
                objectFit: 'cover'
              }} 
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            border: 'none', 
            background: loading ? '#ccc' : '#00796b', 
            color: 'white', 
            fontWeight: '600', 
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '16px'
          }}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
      
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '8px', 
          marginTop: '16px', 
          border: '1px solid #f5c6cb' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

export default AddProduct;


import React, { useState } from 'react';
import axios from 'axios';
import { getAuthHeadersFormData } from '../utils/auth';

interface ProductForm {
  name: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  discount_percentage: string;
  vat_percentage: string;
  discount_started: string;
  discount_finished: string;
  points_rewarded: string;
}

// Using the utility function from auth.ts instead of local getAuthHeader

const AddProduct: React.FC = () => {
  const [form, setForm] = useState<ProductForm>({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    discount_percentage: '',
    vat_percentage: '',
    discount_started: '',
    discount_finished: '',
    points_rewarded: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');

    if (!selectedImage) {
      setError('Please select an image for the product');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('category', form.category);
      formData.append('price', form.price);
      formData.append('stock', form.stock);
      formData.append('description', form.description);
      formData.append('discount_percentage', form.discount_percentage);
      formData.append('vat_percentage', form.vat_percentage);
      formData.append('discount_started', form.discount_started);
      formData.append('discount_finished', form.discount_finished);
      formData.append('points_rewarded', form.points_rewarded);
      formData.append('image', selectedImage);

      await axios.post(
        'http://localhost:5001/api/admin/add-product',
        formData,
        getAuthHeadersFormData()
      );
      
      setSuccess('Product added successfully!');
      setForm({ 
        name: '', 
        category: '', 
        price: '', 
        stock: '', 
        description: '', 
        discount_percentage: '', 
        vat_percentage: '',
        discount_started: '',
        discount_finished: '',
        points_rewarded: '',
      });
      setSelectedImage(null);
      setImagePreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to add product';
      const errorDetails = err.response?.data?.details || '';
      
      if (errorMessage.includes('Invalid admin session') || errorMessage.includes('Please log in again')) {
        setError(`${errorMessage} ${errorDetails ? `(${errorDetails})` : ''}. Please log out and log in with a valid admin account.`);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: '20px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
        Add New Product
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Product Name *</label>
          <input 
            name="name" 
            placeholder="Enter product name" 
            value={form.name} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Category *</label>
          <input 
            name="category" 
            placeholder="Enter category (e.g., Electronics, Clothing)" 
            value={form.category} 
            onChange={handleChange} 
            required 
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Price *</label>
            <input 
              name="price" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={form.price} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Stock *</label>
            <input 
              name="stock" 
              type="number" 
              placeholder="0" 
              value={form.stock} 
              onChange={handleChange} 
              required 
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Description *</label>
          <textarea 
            name="description" 
            placeholder="Enter product description" 
            value={form.description} 
            onChange={handleChange} 
            required 
            rows={4}
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Discount %</label>
            <input 
              name="discount_percentage" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={form.discount_percentage} 
              onChange={handleChange} 
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>VAT %</label>
            <input 
              name="vat_percentage" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={form.vat_percentage} 
              onChange={handleChange} 
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Discount Start Date</label>
            <input
              name="discount_started"
              type="date"
              value={form.discount_started}
              onChange={handleChange}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Discount End Date</label>
            <input
              name="discount_finished"
              type="date"
              value={form.discount_finished}
              onChange={handleChange}
              style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Points Rewarded</label>
          <input 
            name="points_rewarded" 
            type="number" 
            placeholder="0" 
            value={form.points_rewarded} 
            onChange={handleChange} 
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
          />
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Number of points customers will earn when purchasing this product
          </p>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Product Image *</label>
          <input 
            id="image-input"
            name="image" 
            type="file" 
            accept="image/*"
            onChange={handleImageChange} 
            required 
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
          />
          <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            Supported formats: JPG, PNG, GIF. Max size: 5MB
          </p>
        </div>

        {imagePreview && (
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Image Preview:</label>
            <img 
              src={imagePreview} 
              alt="Preview" 
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                borderRadius: 8, 
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
            padding: 16, 
            borderRadius: 8, 
            border: 'none', 
            background: loading ? '#ccc' : '#00796b', 
            color: 'white', 
            fontWeight: 600, 
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: 16
          }}
        >
          {loading ? 'Adding Product...' : 'Add Product'}
        </button>
      </form>
      
      {success && (
        <div style={{ 
          background: '#d4edda', 
          color: '#155724', 
          padding: 12, 
          borderRadius: 8, 
          marginTop: 16, 
          border: '1px solid #c3e6cb' 
        }}>
          {success}
        </div>
      )}
      
      {error && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: 12, 
          borderRadius: 8, 
          marginTop: 16, 
          border: '1px solid #f5c6cb' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default AddProduct; 
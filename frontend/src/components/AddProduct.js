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
    'Content-Type': 'application/json'
  };
};

function AddProduct() {
  const [product, setProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    discount_percentage: '',
    vat_percentage: ''
  });

  const [loading, setLoading] = useState(false);

  // Update input values
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit product
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert numeric fields properly
      const parsedProduct = {
        ...product,
        price: parseFloat(product.price),
        stock: parseInt(product.stock),
        discount_percentage: parseFloat(product.discount_percentage),
        vat_percentage: parseFloat(product.vat_percentage)
      };

      const res = await axios.post(
        'http://localhost:5000/api/admin/add-product',
        parsedProduct,
        { headers: getAuthHeader() }
      );

      alert('✅ Product added successfully!');
      setProduct({ // Reset form
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        image_url: '',
        discount_percentage: '',
        vat_percentage: ''
      });
    } catch (err) {
      console.error(err);
      alert('❌ Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto' }}>
      <h2>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Name" value={product.name} onChange={handleChange} required />
        <input name="category" placeholder="Category" value={product.category} onChange={handleChange} required />
        <input name="price" type="number" placeholder="Price" value={product.price} onChange={handleChange} required />
        <input name="stock" type="number" placeholder="Stock" value={product.stock} onChange={handleChange} required />
        <input name="description" placeholder="Description" value={product.description} onChange={handleChange} required />
        <input name="image_url" placeholder="Image URL" value={product.image_url} onChange={handleChange} required />
        <input name="discount_percentage" type="number" placeholder="Discount %" value={product.discount_percentage} onChange={handleChange} required />
        <input name="vat_percentage" type="number" placeholder="VAT %" value={product.vat_percentage} onChange={handleChange} required />

        <button type="submit" disabled={loading}>
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
}

export default AddProduct;


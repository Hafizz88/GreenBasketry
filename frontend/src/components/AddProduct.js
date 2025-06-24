import React, { useState } from 'react';
import axios from 'axios';

const AddProduct = () => {
  const [product, setProduct] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    discount_percentage: 0,
    vat_percentage: 0
  });

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/admin/add-product', product);
      alert('Product added successfully');
    } catch (err) {
      console.error(err);
      alert('Error adding product');
    }
  };

  return (
    <div>
      <h3>Add New Product</h3>
      <form onSubmit={handleSubmit}>
        <input type="text" name="name" value={product.name} onChange={handleChange} placeholder="Product Name" required />
        <input type="text" name="category" value={product.category} onChange={handleChange} placeholder="Category" required />
        <input type="number" name="price" value={product.price} onChange={handleChange} placeholder="Price" required />
        <input type="number" name="stock" value={product.stock} onChange={handleChange} placeholder="Stock" required />
        <textarea name="description" value={product.description} onChange={handleChange} placeholder="Description" required></textarea>
        <input type="text" name="image_url" value={product.image_url} onChange={handleChange} placeholder="Image URL" />
        <input type="number" name="discount_percentage" value={product.discount_percentage} onChange={handleChange} placeholder="Discount Percentage" />
        <input type="number" name="vat_percentage" value={product.vat_percentage} onChange={handleChange} placeholder="VAT Percentage" />
        <button type="submit">Add Product</button>
      </form>
    </div>
  );
};

export default AddProduct;

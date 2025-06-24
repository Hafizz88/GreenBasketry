import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ManageProducts = () => {
  const [products, setProducts] = useState([]);

  // Fetch products from backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/products');
      setProducts(res.data);
    } catch (err) {
      alert('Failed to fetch products');
    }
  };

  // Remove product by ID
  const handleRemove = async (productId) => {
    if (!window.confirm('Are you sure you want to remove this product?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/admin/products/${productId}`);
      setProducts(products.filter(p => p.product_id !== productId));
      alert('Product removed!');
    } catch (err) {
      alert('Failed to remove product');
    }
  };

  return (
    <div>
      <h3>Manage Products</h3>
      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(prod => (
            <tr key={prod.product_id}>
              <td>{prod.name}</td>
              <td>{prod.category}</td>
              <td>{prod.price}</td>
              <td>{prod.stock}</td>
              <td>
                {/* You can add edit button here */}
                <button onClick={() => handleRemove(prod.product_id)}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageProducts;
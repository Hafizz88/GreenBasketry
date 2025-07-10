import React, { useEffect, useState } from 'react';
import axios from 'axios';


const ManageProducts = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);
  const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/products', getAuthHeader());
      setProducts(res.data);
    } catch (err) {
      console.error('❌ Failed to fetch products:', err);
      alert('Failed to fetch products');
    }
  };

  // Delete product
  const handleRemove = async (productId) => {
    const confirmed = window.confirm('Are you sure you want to delete this product?');
    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/products/${productId}`, getAuthHeader());
      setProducts(products.filter(p => p.product_id !== productId));
      alert('✅ Product deleted successfully');
    } catch (err) {
      console.error('❌ Failed to delete product:', err);
      alert('Failed to delete product');
    }
  };

  return (
    <div>
      <h3>Manage Products</h3>
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
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
                  <button onClick={() => handleRemove(prod.product_id)}>Remove</button>
                  {/* You can add an Edit button here */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
export default ManageProducts;
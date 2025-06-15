import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Product() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/products') // change PORT accordingly
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to load products', err));
  }, []);

  return (
    <div className="product-grid">
      <p>Available Products:</p>
      {products.map(product => (
        <div key={product.product_id} className="product-card">
          <img src={product.image_url} alt={product.name} />
          <h3>{product.name}</h3>
          <p>{product.category}</p>
          <p>${product.price}</p>
          <p>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</p>
        </div>
      ))}
    </div>
  );
}

export default Product;

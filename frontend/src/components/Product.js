import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Product() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5001/api/products') // change PORT accordingly
      .then(res => setProducts(res.data))
      .catch(err => console.error('Failed to load products', err));
  }, []);

const handleAddToCart = async (productId) => {
  try {
    console.log("🛒 Add to cart button clicked! Product ID:", productId);
    const storedCustomerId = localStorage.getItem('customer_id');
    console.log("📦 Retrieved customer_id from localStorage:", storedCustomerId);

    const customerId = parseInt(storedCustomerId, 10);
    if (!customerId || isNaN(customerId)) {
      alert("Customer ID is invalid or missing!");
      return;
    }

    console.log("➡️ Sending POST to /api/cart with:", {
      customer_id: customerId,
      product_id: productId,
      quantity: 1
    });

    await axios.post('http://localhost:5001/api/cart', {
      customer_id: customerId,
      product_id: productId,
      quantity: 1
    });

    alert('Added to cart!');
  } catch (err) {
    console.error('❌ Add to cart failed:', err.response?.data || err.message);
    alert('Failed to add to cart');
  }
};

  const handleAddToWishlist = async (productId) => {
    try {
      await axios.post('http://localhost:5001/api/wishlist', {
        customer_id: 1, // Replace with actual logged-in user ID
        product_id: productId
      });
      alert('Added to wishlist!');
    } catch (err) {
      console.error('Add to wishlist failed', err);
      alert('Failed to add to wishlist');
    }
  };

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
          <button 
  onClick={(e) => {
    console.log("🔥 BUTTON CLICKED!");
    console.log("Event object:", e);
    console.log("Product ID:", product.product_id);
    console.log("Product object:", product);
    e.preventDefault();
    e.stopPropagation();
    
    // Check if function exists
    if (typeof handleAddToCart === 'function') {
      console.log("✅ handleAddToCart function exists");
      handleAddToCart(product.product_id);
    } else {
      console.log("❌ handleAddToCart function NOT found");
    }
  }}
  style={{ backgroundColor: 'red', color: 'white', padding: '10px' }}
>
  DEBUG - Add to Cart
</button>
          <button onClick={() => handleAddToWishlist(product.product_id)}>
            Wishlist
          </button>
        </div>
      ))}
    </div>
  );
}

export default Product;

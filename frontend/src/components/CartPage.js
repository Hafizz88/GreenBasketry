import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CartProfilePages.css';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replace with actual customer ID from auth/session
  const customerId = 1;

  // Function to fetch cart and items
  const fetchCart = async () => {
    try {
      const res = await axios.get(`/api/cart?customer_id=${customerId}`);
      setCart(res.data.cart);
      setCartItems(res.data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart initially on component mount
  useEffect(() => {
    fetchCart();
  }, [customerId]); // Re-fetch if customerId changes

  // Function to handle add to cart
  const handleAddToCart = async (productId) => {
    try {
      await axios.post('/api/cart', {
        customer_id: customerId,
        product_id: productId,
        quantity: 1
      });
      alert('Added to cart!');
      // Refetch cart after adding an item
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  // Function to remove an item from cart
  const handleRemoveFromCart = async (productId) => {
    try {
      await axios.delete('/api/cart', {
        data: { customer_id: customerId, product_id: productId }
      });
      alert('Removed from cart!');
      // Refetch cart after removing an item
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  // Function to update the cart item quantity
  const handleUpdateCartItem = async (productId, newQuantity) => {
    try {
      await axios.put('/api/cart', {
        customer_id: customerId,
        product_id: productId,
        quantity: newQuantity
      });
      alert('Updated cart item quantity!');
      // Refetch cart after updating an item
      fetchCart();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!cart) return <div>No active cart found.</div>;

  return (
    <div>
      <h2>Your Cart</h2>
      <ul>
        {cartItems.map(item => (
          <li key={item.cart_item_id}>
            <img src={item.image_url} alt={item.name} width={60} />
            <span>{item.name}</span>
            <span>Qty: {item.quantity}</span>
            <span>Price: ৳{item.price}</span>
            <button onClick={() => handleRemoveFromCart(item.product_id)}>Remove</button>
            {/* Optionally, add update quantity functionality */}
            <button onClick={() => handleUpdateCartItem(item.product_id, item.quantity + 1)}>Increase Quantity</button>
          </li>
        ))}
      </ul>
      <div>
        <strong>Total: ৳{cart.price}</strong>
      </div>
      <button>Checkout</button>
    </div>
  );
}

export default CartPage;

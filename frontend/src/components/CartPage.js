import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CartPageProfile.css';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replace with actual customer ID from auth/session
  const customerId = localStorage.getItem('userId');

  // Function to fetch cart and items
  const fetchCart = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/cart?customer_id=${customerId}`);
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
      await axios.post(`http://localhost:5000/api/cart`, {
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
      await axios.delete(`http://localhost:5000/api/cart`, {
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
      await axios.put(`http://localhost:5000/api/cart`, {
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
  <div className="cart-container">
    <h2>Your Cart</h2>
    <ul className="cart-list">
      {cartItems.map(item => (
        <li key={item.cart_item_id} className="cart-item">
          <img src={item.image_url} alt={item.name} />
          <span>{item.name}</span>
          <span>Qty: {item.quantity}</span>
          <span>৳{item.price}</span>
          <button onClick={() => handleUpdateCartItem(item.product_id, item.quantity + 1)}>+ Qty</button>
          <button onClick={() => handleRemoveFromCart(item.product_id)}>Remove</button>
        </li>
      ))}
    </ul>
    <div className="cart-total">
      Total: ৳{cart.price}
    </div>
    <button className="checkout-btn">Checkout</button>
  </div>
);
}




export default CartPage;

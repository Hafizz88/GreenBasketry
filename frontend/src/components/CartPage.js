import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CartPageProfile.css';
import { useNavigate } from 'react-router-dom';

function CartPage() {
  const [cart, setCart] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    };
  };

  const customerId = localStorage.getItem('userId');

  const fetchCart = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/cart`, {
        ...getAuthHeader(),
        params: { customer_id: customerId }
      });

      console.log('Cart response:', response.data);

      if (response.data.cart) {
        setCart(response.data.cart);
        setCartItems(response.data.items);
      } else {
        setCart(null);
        setCartItems([]);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [customerId]);

  const handleAddToCart = async (productId) => {
    try {
      await axios.post(
        `http://localhost:5001/api/cart`,
        {
          customer_id: customerId,
          product_id: productId,
          quantity: 1
        },
        getAuthHeader()
      );
      alert('Added to cart!');
      fetchCart();
    } catch (err) {
      console.error('Add to cart failed:', err);
    }
  };

  const handleRemoveFromCart = async (productId) => {
    try {
      await axios.delete(`http://localhost:5001/api/cart`, {
        ...getAuthHeader(),
        data: {
          customer_id: customerId,
          product_id: productId
        }
      });
      alert('Removed from cart!');
      fetchCart();
    } catch (err) {
      console.error('Remove from cart failed:', err);
    }
  };

  const handleUpdateCartItem = async (productId, newQuantity) => {
    try {
      await axios.put(
        `http://localhost:5001/api/cart`,
        {
          customer_id: customerId,
          product_id: productId,
          quantity: newQuantity
        },
        getAuthHeader()
      );
      alert('Updated cart item quantity!');
      fetchCart();
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!cart) return <div>No active cart found.</div>;

  return (
    <div className="cart-container">
      <h2>Your Cart</h2>
      <ul className="cart-list">
        {cartItems.map((item) => (
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
      <div className="cart-total">Total: ৳{cart.price}</div>
      <button className="checkout-btn" onClick={() => navigate('/voucher-summary')}>
        Next
      </button>
    </div>
  );
}

export default CartPage;



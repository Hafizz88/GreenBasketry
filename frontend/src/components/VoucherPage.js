import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VoucherPage.css';

function VoucherSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const customerId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/vouchers/${customerId}`);
        setSummary(response.data);
      } catch (error) {
        console.error('Failed to fetch voucher summary:', error);
        alert('Could not load voucher/cart summary.');
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchSummary();
    } else {
      alert('Please log in to continue');
      navigate('/login');
    }
  }, [customerId, navigate]);

  if (loading) return <div>Loading summary...</div>;
  if (!summary) return <div>No summary available.</div>;

  // Handler for Proceed button
  const handleProceed = async () => {
    setPlacing(true);
    
    try {
      // Prepare order data for the placeOrder endpoint
      const orderData = {
        customer_id: parseInt(customerId), // Ensure it's an integer
        cart_id: summary.cart_id,
        points_used: summary.points_used || 0
      };

      // Add coupon_code only if there's an active coupon
      if (summary.active_coupon_code) {
        orderData.coupon_code = summary.active_coupon_code;
      }

      console.log('Placing order with data:', orderData);

      // Fixed: Use the correct endpoint - /api/orders instead of /api/orders/place
      const response = await axios.post('http://localhost:5000/api/orders', orderData);
      
      console.log('Order response:', response.data);
      
      if (response.data.success) {
        alert('Order placed successfully!');
        navigate('/order-success', { 
          state: { 
            orderId: response.data.order_id,
            deliveryId: response.data.delivery_id,
            totalAmount: response.data.total_amount
          }
        });
      } else {
        throw new Error(response.data.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Order placement failed:', err);
      
      // More specific error handling
      if (err.response) {
        const errorMessage = err.response.data?.error || err.response.data?.message || 'Failed to place order';
        alert(`Order failed: ${errorMessage}`);
        console.error('Server error details:', err.response.data);
      } else if (err.request) {
        alert('Network error. Please check your connection and try again.');
        console.error('Network error:', err.request);
      } else {
        alert('Failed to place order. Please try again.');
        console.error('Error:', err.message);
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="voucher-summary">
      <h2>Voucher & Cart Summary</h2>
      <div className="summary-grid">
        <p><strong>Cart ID:</strong> {summary.cart_id}</p>
        <p><strong>Subtotal:</strong> ৳{parseFloat(summary.subtotal || 0).toFixed(2)}</p>
        <p><strong>Total VAT:</strong> ৳{parseFloat(summary.total_vat || 0).toFixed(2)}</p>
        <p><strong>Total Discount:</strong> ৳{parseFloat(summary.total_discount || 0).toFixed(2)}</p>
        <p><strong>Delivery Fee:</strong> ৳{parseFloat(summary.delivery_fee || 0).toFixed(2)}</p>
        <p><strong>Grand Total:</strong> ৳{parseFloat(summary.grand_total || 0).toFixed(2)}</p>

        {summary.active_coupon_code ? (
          <p>
            <strong>Active Coupon:</strong> {summary.active_coupon_code} (-{summary.active_coupon_discount}%)
          </p>
        ) : (
          <p><em>No active coupons applied.</em></p>
        )}
      </div>

      <div className="action-buttons">
        <button 
          onClick={() => navigate(-1)} 
          className="back-button"
          disabled={placing}
        >
          ⬅ Back
        </button>
        <button 
          onClick={handleProceed} 
          className="proceed-button"
          disabled={placing || !summary.cart_id}
        >
          {placing ? 'Placing Order...' : 'Proceed ➡'}
        </button>
      </div>
    </div>
  );
}

export default VoucherSummary;
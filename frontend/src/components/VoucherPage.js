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

  // Get authentication header
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      return null;
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Check if user is authenticated
        const authHeader = getAuthHeader();
        if (!authHeader) {
          alert('Please log in to continue');
          navigate('/login');
          return;
        }

        if (!customerId) {
          alert('Please log in to continue');
          navigate('/login');
          return;
        }

        console.log('Fetching voucher summary for customer:', customerId);
        
        const response = await axios.get(
          `http://localhost:5000/api/vouchers/${customerId}`,
          authHeader
        );
        
        console.log('Voucher summary response:', response.data);
        setSummary(response.data);
        
      } catch (error) {
        console.error('Failed to fetch voucher summary:', error);
        
        if (error.response?.status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/login');
        } else if (error.response?.status === 404) {
          alert('No cart found. Please add items to your cart first.');
          navigate('/products');
        } else {
          const errorMessage = error.response?.data?.error || 'Could not load voucher/cart summary.';
          alert(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [customerId, navigate]);

  // Handler for Proceed button
  const handleProceed = async () => {
    if (!summary || !summary.cart_id) {
      alert('Invalid cart data. Please refresh and try again.');
      return;
    }

    setPlacing(true);
    
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        alert('Please log in to continue');
        navigate('/login');
        return;
      }

      // Prepare order data for the placeOrder endpoint
      const orderData = {
        customer_id: parseInt(customerId),
        cart_id: summary.cart_id,
        points_used: summary.points_used || 0
      };

      // Add coupon_code only if there's an active coupon
      if (summary.active_coupon_code) {
        orderData.coupon_code = summary.active_coupon_code;
      }

      console.log('Placing order with data:', orderData);

      const response = await axios.post(
        'http://localhost:5000/api/orders',
        orderData,
        authHeader
      );
      
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
      
      // Handle specific error responses
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        
        if (status === 401) {
          alert('Session expired. Please log in again.');
          navigate('/login');
        } else if (status === 400) {
          const errorMessage = errorData?.error || 'Invalid order data';
          alert(`Order failed: ${errorMessage}`);
        } else if (status === 404) {
          alert('Cart not found. Please add items to your cart first.');
          navigate('/products');
        } else if (status === 500) {
          alert('Server error. Please try again later.');
        } else {
          const errorMessage = errorData?.error || errorData?.message || 'Failed to place order';
          alert(`Order failed: ${errorMessage}`);
        }
        
        console.error('Server error details:', errorData);
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

  // Loading state
  if (loading) {
    return (
      <div className="voucher-summary">
        <div className="loading">Loading summary...</div>
      </div>
    );
  }

  // No summary state
  if (!summary) {
    return (
      <div className="voucher-summary">
        <div className="error">
          <h2>No summary available</h2>
          <p>Unable to load cart summary. Please try refreshing the page.</p>
          <button onClick={() => navigate('/cart')} className="back-button">
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  // Format currency values safely
  const formatCurrency = (value) => {
    const numValue = parseFloat(value || 0);
    return `৳${numValue.toFixed(2)}`;
  };

  return (
    <div className="voucher-summary">
      <h2>Order Summary</h2>
      
      <div className="summary-grid">
        <div className="summary-item">
          <span className="label">Cart ID:</span>
          <span className="value">{summary.cart_id}</span>
        </div>
        
        <div className="summary-item">
          <span className="label">Subtotal:</span>
          <span className="value">{formatCurrency(summary.subtotal)}</span>
        </div>
        
        <div className="summary-item">
          <span className="label">VAT:</span>
          <span className="value">{formatCurrency(summary.total_vat)}</span>
        </div>
        
        <div className="summary-item">
          <span className="label">Discount:</span>
          <span className="value discount">-{formatCurrency(summary.total_discount)}</span>
        </div>
        
        <div className="summary-item">
          <span className="label">Delivery Fee:</span>
          <span className="value">{formatCurrency(summary.delivery_fee)}</span>
        </div>
        
        <div className="summary-item total">
          <span className="label">Grand Total:</span>
          <span className="value">{formatCurrency(summary.grand_total)}</span>
        </div>
      </div>

      {/* Coupon Information */}
      <div className="coupon-section">
        {summary.active_coupon_code ? (
          <div className="active-coupon">
            <h3>Applied Coupon</h3>
            <p>
              <strong>Code:</strong> {summary.active_coupon_code}
              <span className="discount-badge">
                -{summary.active_coupon_discount}%
              </span>
            </p>
          </div>
        ) : (
          <div className="no-coupon">
            <p><em>No coupons applied</em></p>
          </div>
        )}
      </div>

      {/* Points Information */}
      {summary.points_used > 0 && (
        <div className="points-section">
          <h3>Points Used</h3>
          <p>You used <strong>{summary.points_used}</strong> loyalty points</p>
        </div>
      )}

      {/* Action Buttons */}
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
          {placing ? 'Placing Order...' : 'Place Order ➡'}
        </button>
      </div>
    </div>
  );
}

export default VoucherSummary;
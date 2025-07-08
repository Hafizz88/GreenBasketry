import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data passed from the previous page
  const { orderId, deliveryId, totalAmount } = location.state || {};

  return (
    <div className="order-success" style={{ 
      textAlign: 'center', 
      padding: '40px 20px', 
      maxWidth: '600px', 
      margin: '0 auto' 
    }}>
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '30px', 
        borderRadius: '10px',
        border: '2px solid #28a745'
      }}>
        <h2 style={{ color: '#28a745', marginBottom: '20px' }}>
          🎉 Order Placed Successfully!
        </h2>
        
        <p style={{ fontSize: '18px', color: '#666', marginBottom: '25px' }}>
          Your order has been placed and will be processed soon.
        </p>

        {orderId && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '25px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>Order Details</h3>
            <div style={{ textAlign: 'left' }}>
              <p><strong>Order ID:</strong> #{orderId}</p>
              {deliveryId && <p><strong>Delivery ID:</strong> #{deliveryId}</p>}
              {totalAmount && <p><strong>Total Amount:</strong> ৳{parseFloat(totalAmount).toFixed(2)}</p>}
              <p><strong>Estimated Delivery:</strong> 45 minutes</p>
              <p><strong>Status:</strong> <span style={{ color: '#ffc107' }}>Processing</span></p>
            </div>
          </div>
        )}

        <div style={{ 
          backgroundColor: '#e7f3ff', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '25px'
        }}>
          <h4 style={{ color: '#0066cc', marginBottom: '10px' }}>What's Next?</h4>
          <ul style={{ textAlign: 'left', color: '#555' }}>
            <li>You will receive a confirmation SMS/email shortly</li>
            <li>A rider will be assigned to your order</li>
            <li>You can track your delivery in real-time</li>
            <li>Payment will be collected upon delivery</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/orders')}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            View My Orders
          </button>
          
          <button 
            onClick={() => navigate('/products')}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
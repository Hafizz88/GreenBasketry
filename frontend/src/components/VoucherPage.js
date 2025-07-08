import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './VoucherPage.css'; // optional for styling

function VoucherSummary({ onProceed, onBack }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const customerId = localStorage.getItem('userId');

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

    fetchSummary();
  }, [customerId]);

  if (loading) return <div>Loading summary...</div>;
  if (!summary) return <div>No summary available.</div>;

  return (
    <div className="voucher-summary">
      <h2>Voucher & Cart Summary</h2>
      <div className="summary-grid">
        <p><strong>Subtotal:</strong> ৳{parseFloat(summary.subtotal).toFixed(2)}</p>
        <p><strong>Total VAT:</strong> ৳{parseFloat(summary.total_vat).toFixed(2)}</p>
        <p><strong>Total Discount:</strong> ৳{parseFloat(summary.total_discount).toFixed(2)}</p>
        <p><strong>Delivery Fee:</strong> ৳{parseFloat(summary.delivery_fee).toFixed(2)}</p>
        <p><strong>Grand Total:</strong> ৳{parseFloat(summary.grand_total).toFixed(2)}</p>

        {summary.active_coupon_code ? (
          <p>
            <strong>Active Coupon:</strong> {summary.active_coupon_code} (-{summary.active_coupon_discount}%)
          </p>
        ) : (
          <p><em>No active coupons applied.</em></p>
        )}
      </div>

      <div className="action-buttons">
        <button onClick={onBack} className="back-button">⬅ Back</button>
        <button onClick={onProceed} className="proceed-button">Proceed ➡</button>
      </div>
    </div>
  );
}

export default VoucherSummary;


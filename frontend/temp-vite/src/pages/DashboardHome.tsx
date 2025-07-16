import React from 'react';
import { Link } from 'react-router-dom';

const DashboardHome: React.FC = () => {
  return (
    <div style={{ maxWidth: 700, margin: 'auto', textAlign: 'center', padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Welcome to the Admin Dashboard</h1>
      <p style={{ fontSize: 18, color: '#555', marginBottom: 32 }}>
        Use the sidebar to manage products, coupons, and discounts.<br />
        Here are some quick links:
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
        <Link to="products" style={{ background: '#6366f1', color: '#fff', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>Manage Products</Link>
        <Link to="coupons" style={{ background: '#10b981', color: '#fff', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>Manage Coupons</Link>
        <Link to="set-discount" style={{ background: '#f59e42', color: '#fff', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>Set Discount</Link>
      </div>
    </div>
  );
};

export default DashboardHome; 
import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './AdminDashboard.css';

const navLinks = [
  { to: 'products', label: 'Manage Products' },
  { to: 'add-product', label: 'Add New Product' },
  { to: 'coupons', label: 'Manage Coupons' },
  { to: 'set-discount', label: 'Set Product Discount' },
];

const AdminDashboard = () => {
  const location = useLocation();

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-logo">Admin Panel</div>
        <nav>
          <ul>
            {navLinks.map(link => (
              <li key={link.to} className={location.pathname.includes(link.to) ? 'active' : ''}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="admin-content">
        <header className="admin-header">
          <h2>Welcome, Admin</h2>
        </header>
        <section className="admin-main-section">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

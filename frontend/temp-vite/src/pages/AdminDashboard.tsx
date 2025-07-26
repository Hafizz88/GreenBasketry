import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import ComplaintsAdminPage from './ComplaintsAdminPage';

const navLinks = [
  { to: 'products', label: 'Manage Products' },
  { to: 'add-product', label: 'Add New Product' },
  { to: 'coupons', label: 'Manage Coupons' },
  { to: 'set-discount', label: 'Set Product Discount' },
  { to: 'complaints', label: 'Manage Complaints' },
];

const AdminDashboard: React.FC = () => {
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, background: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem 1rem 1rem', boxShadow: '2px 0 8px #0001' }}>
        <div style={{ fontWeight: 700, fontSize: 28, marginBottom: 32, letterSpacing: 1 }}>Admin Panel</div>
        <nav style={{ width: '100%' }}>
          <ul style={{ listStyle: 'none', padding: 0, width: '100%' }}>
            {navLinks.map(link => (
              <li key={link.to} style={{ marginBottom: 16 }}>
                <Link
                  to={link.to}
                  style={{
                    display: 'block',
                    padding: '0.75rem 1rem',
                    borderRadius: 8,
                    background: location.pathname.includes(link.to) ? '#6366f1' : 'transparent',
                    color: location.pathname.includes(link.to) ? '#fff' : '#cbd5e1',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem 2rem 2rem 2.5rem', minHeight: '100vh' }}>
        <header style={{ marginBottom: 32, borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 32, color: '#1e293b' }}>Welcome, Admin</h2>
        </header>
        <section>
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard; 
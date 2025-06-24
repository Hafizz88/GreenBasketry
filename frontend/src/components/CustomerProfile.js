import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CartProfilePages.css';

function CustomerProfile() {
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replace with actual customer ID from auth/session
  const customerId = 1;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // 1. Get customer info
        const customerRes = await axios.get(`/api/customers/${customerId}`);
        setCustomer(customerRes.data);

        // 2. Get addresses
        const addressRes = await axios.get(`/api/addresses?customer_id=${customerId}`);
        setAddresses(addressRes.data);

        // 3. Get orders
        const ordersRes = await axios.get(`/api/orders?customer_id=${customerId}`);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [customerId]);

  if (loading) return <div>Loading...</div>;
  if (!customer) return <div>Profile not found.</div>;

  return (
    <div>
      <h2>Profile</h2>
      <p><strong>Name:</strong> {customer.name}</p>
      <p><strong>Email:</strong> {customer.email}</p>
      <p><strong>Phone:</strong> {customer.phone}</p>
      <p><strong>Points Earned:</strong> {customer.points_earned}</p>
      <p><strong>Points Used:</strong> {customer.points_used}</p>
      <h3>Addresses</h3>
      <ul>
        {addresses.map(addr => (
          <li key={addr.address_id}>
            {addr.address_line}, {addr.city}, {addr.state}, {addr.country} ({addr.postal_code})
            {addr.is_default && <strong> [Default]</strong>}
          </li>
        ))}
      </ul>
      <h3>Order History</h3>
      <ul>
        {orders.map(order => (
          <li key={order.order_id}>
            Order #{order.order_id} - {order.order_status} - ৳{order.total_amount}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CustomerProfile;
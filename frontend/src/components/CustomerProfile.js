import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CustomerProfile.css';

function CustomerProfile() {
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const customerId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const customerRes = await axios.get(`http://localhost:5000/api/customers/${customerId}`);
        setCustomer(customerRes.data);

        // const addressRes = await axios.get(`http://localhost:5000/api/customers/${customerId}/addresses`);
        // setAddresses(addressRes.data);

        const wishlistRes = await axios.get(`http://localhost:5000/api/wishlist?customer_id=${customerId}`);
        setWishlist(wishlistRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [customerId]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/api/wishlist`, {
        data: {
          customer_id: customerId,
          product_id: productId
        }
      });

      // Remove the item from UI
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
    } catch (err) {
      console.error("Failed to remove item from wishlist", err);
      alert("Failed to remove item");
    }
  };

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

      <h3>Wishlist</h3>
      {wishlist.length === 0 ? (
        <p>No items in wishlist.</p>
      ) : (
        <ul>
          {wishlist.map(item => (
            <li key={item.wishlist_id}>
              🛒 {item.name} - ৳{item.price}{" "}
              <button onClick={() => handleRemoveFromWishlist(item.product_id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default CustomerProfile;

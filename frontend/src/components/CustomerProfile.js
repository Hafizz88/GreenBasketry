import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CustomerProfile.css';

function CustomerProfile() {
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [thanas, setThanas] = useState([]);
  const [newAddress, setNewAddress] = useState({
    address_line: '',
    thana_name: '',
    postal_code: ''
  });

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

  const customerId = localStorage.getItem('userId');

  useEffect(() => {
    console.log('Customer ID from localStorage:', customerId);
  console.log('Type of customer ID:', typeof customerId);
  
  if (!customerId) {
    console.error('No customer ID found in localStorage');
    setLoading(false);
    return;}
    
    const fetchProfile = async () => {
      try {
        const authHeader = getAuthHeader();
        if (!authHeader) {
          console.error('No auth header available');
          setLoading(false);
          return;
        }

        if (!customerId) {
          console.error('No customer ID found');
          setLoading(false);
          return;
        }

        console.log('Fetching profile for customer:', customerId);
        console.log('Auth header:', authHeader);

        // Fetch customer data
        const customerRes = await axios.get(`http://localhost:5000/api/customers/${customerId}`, authHeader);
        setCustomer(customerRes.data);

        // Fetch addresses
        const addressRes = await axios.get(`http://localhost:5000/api/customers/${customerId}/addresses`, authHeader);
        setAddresses(addressRes.data);

        // Fetch wishlist
        const wishlistRes = await axios.get(`http://localhost:5000/api/wishlist?customer_id=${customerId}`, authHeader);
        setWishlist(wishlistRes.data);

        // Fetch thanas with detailed logging
        console.log('Fetching thanas...');
        const thanasRes = await axios.get('http://localhost:5000/api/thanas', authHeader);
        console.log('Thanas response:', thanasRes.data);
        
        // Check the structure of the response
        if (thanasRes.data && thanasRes.data.thanas) {
          console.log('Thanas array:', thanasRes.data.thanas);
          setThanas(thanasRes.data.thanas);
        } else if (Array.isArray(thanasRes.data)) {
          console.log('Thanas direct array:', thanasRes.data);
          setThanas(thanasRes.data);
        } else {
          console.error('Unexpected thanas response structure:', thanasRes.data);
          setThanas([]);
        }
        
      } catch (err) {
        console.error('Error fetching profile data:', err);
        if (err.response) {
          console.error('Error response:', err.response.data);
          console.error('Error status:', err.response.status);
          
          // Handle specific error cases
          if (err.response.status === 401) {
            console.error('Unauthorized - token may be invalid or expired');
            // Optionally redirect to login
            // window.location.href = '/login';
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (customerId) {
      fetchProfile();
    } else {
      console.error('No customer ID found in localStorage');
      setLoading(false);
    }
  }, [customerId]);

  // Add this useEffect to monitor thanas state changes
  useEffect(() => {
    console.log('Thanas state updated:', thanas);
  }, [thanas]);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        alert('Authentication required');
        return;
      }

      await axios.delete(`http://localhost:5000/api/wishlist`, {
        ...authHeader,
        data: {
          customer_id: customerId,
          product_id: productId
        }
      });

      // Remove the item from UI
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      alert('Item removed from wishlist');
    } catch (err) {
      console.error("Failed to remove item from wishlist", err);
      if (err.response && err.response.status === 401) {
        alert("Authentication failed. Please log in again.");
      } else {
        alert("Failed to remove item");
      }
    }
  };

  const handleAddressChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewAddress(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newAddress.address_line.trim() || !newAddress.thana_name.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const authHeader = getAuthHeader();
      if (!authHeader) {
        alert('Authentication required');
        return;
      }

      const { address_line, thana_name, postal_code } = newAddress;

      const response = await axios.post(`http://localhost:5000/api/customers/${customerId}/addresses`, {
        customer_id: customerId,
        address_line: address_line.trim(),
        thana_name: thana_name.trim(),
        postal_code: postal_code.trim(),
        is_default: true
      }, authHeader);

      // Add the new address to the list
      setAddresses(prev => [...prev, response.data]);

      // Reset form and close modal
      setNewAddress({
        address_line: '',
        thana_name: '',
        postal_code: ''
      });
      setShowAddAddressForm(false);

      alert('Address added successfully!');
    } catch (err) {
      console.error('Failed to add address', err);
      if (err.response && err.response.status === 401) {
        alert('Authentication failed. Please log in again.');
      } else {
        alert('Failed to add address. Please try again.');
      }
    }
  };

  const handleCancelAddAddress = () => {
    setShowAddAddressForm(false);
    setNewAddress({
      address_line: '',
      thana_name: '',
      postal_code: ''
    });
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!customer) return <div className="error">Profile not found.</div>;

  return (
    <div className="profile-container">
      <h2>Profile</h2>
      <div className="profile-info">
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Email:</strong> {customer.email}</p>
        <p><strong>Phone:</strong> {customer.phone}</p>
        <p><strong>Points Earned:</strong> {customer.points_earned}</p>
        <p><strong>Points Used:</strong> {customer.points_used}</p>
      </div>

      <div className="addresses-section">
        <h3>Addresses</h3>
        {addresses.length === 0 ? (
          <div className="empty-state">
            <p>No addresses found.</p>
            <button 
              className="add-address-btn"
              onClick={() => setShowAddAddressForm(true)}
            >
              Add your address
            </button>
          </div>
        ) : (
          <div>
            <ul className="addresses-list">
              {addresses.map(addr => (
                <li key={addr.address_id} className="address-item">
                  {addr.address_line}, {addr.thana_name}{addr.postal_code ? ` (${addr.postal_code})` : ''}
                </li>
              ))}
            </ul>
            <button 
              className="add-address-btn secondary"
              onClick={() => setShowAddAddressForm(true)}
            >
              Add New Address
            </button>
          </div>
        )}
      </div>

      {/* Add Address Form Modal */}
      {showAddAddressForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Address</h3>
            <form onSubmit={handleAddAddress}>
              <div className="form-group">
                <input
                  type="text"
                  name="address_line"
                  placeholder="Address Line *"
                  value={newAddress.address_line}
                  onChange={handleAddressChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <select
                  name="thana_name"
                  value={newAddress.thana_name}
                  onChange={handleAddressChange}
                  required
                >
                  <option value="">Select a Thana *</option>
                  {thanas.length > 0 ? (
                    thanas.map((thana, index) => (
                      <option key={thana.id || index} value={thana.thana_name}>
                        {thana.thana_name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading thanas...</option>
                  )}
                </select>
                {/* Debug info - remove this in production */}
                <small style={{color: 'gray', fontSize: '12px'}}>
                  Debug: {thanas.length} thanas loaded
                </small>
              </div>
              
              <div className="form-group">
                <input
                  type="text"
                  name="postal_code"
                  placeholder="Postal Code (optional)"
                  value={newAddress.postal_code}
                  onChange={handleAddressChange}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit"
                  className="save-btn"
                >
                  Save Address
                </button>
                <button 
                  type="button"
                  className="cancel-btn"
                  onClick={handleCancelAddAddress}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="wishlist-section">
        <h3>Wishlist</h3>
        {wishlist.length === 0 ? (
          <p className="empty-wishlist">No items in wishlist.</p>
        ) : (
          <ul className="wishlist-items">
            {wishlist.map(item => (
              <li key={item.wishlist_id} className="wishlist-item">
                <span className="item-info">
                  🛒 {item.name} - ৳{item.price}
                </span>
                <button 
                  className="remove-btn"
                  onClick={() => handleRemoveFromWishlist(item.product_id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CustomerProfile;
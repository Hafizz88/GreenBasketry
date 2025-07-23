import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RiderHome.css';

const RiderHome = () => {
  const navigate = useNavigate();
  const [rider, setRider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, orders, profile
  const [availableOrders, setAvailableOrders] = useState([]);
  const [currentAssignments, setCurrentAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentZone, setCurrentZone] = useState('');
  const [location, setLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const ZONE_OPTIONS = [
    'North & Northeast Dhaka',
    'South Dhaka',
    'Central Dhaka',
    'Suburban Areas'
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('role');
    
    console.log('RiderHome useEffect - user:', user); // Debug log
    console.log('RiderHome useEffect - role:', role); // Debug log
    
    if (!user || role !== 'rider') {
      console.log('Redirecting to home - no user or wrong role'); // Debug log
      navigate('/');
    } else {
      console.log('Setting rider data:', user); // Debug log
      setRider(user);
      setIsLoading(false);
      // Set rider as online by default
      setIsOnline(true);
      
      // Load current zone from localStorage
      const storedZone = localStorage.getItem('currentZone');
      if (storedZone) {
        setCurrentZone(storedZone);
      }
      
      if (user.rider_id) {
        console.log('Fetching rider data for ID:', user.rider_id); // Debug log
        fetchRiderData(user.rider_id);
      } else {
        console.error('No rider_id found in user data:', user); // Debug log
        // Try to get rider_id from localStorage userId
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          const userId = JSON.parse(storedUserId);
          console.log('Using stored userId as rider_id:', userId); // Debug log
          const updatedUser = { ...user, rider_id: userId };
          setRider(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          fetchRiderData(userId);
        }
      }
    }
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchRiderData = async (riderId) => {
    if (!riderId) {
      console.error('No rider ID available');
      return;
    }
    
    try {
      // Fetch current assignments
      const assignmentsResponse = await fetch(`http://localhost:5001/api/rider/${riderId}/current-assignments`, {
        headers: getAuthHeaders()
      });
      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        setCurrentAssignments(assignments);
      }

      // Fetch notifications
      const notificationsResponse = await fetch(`http://localhost:5001/api/rider/${riderId}/notifications`, {
        headers: getAuthHeaders()
      });
      if (notificationsResponse.ok) {
        const notifications = await notificationsResponse.json();
        setNotifications(notifications);
      }
    } catch (error) {
      console.error('Error fetching rider data:', error);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch('http://localhost:5001/api/rider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const riderData = await response.json();
        localStorage.setItem('user', JSON.stringify(riderData));
        localStorage.setItem('role', 'rider');
        setRider(riderData);
        setIsLoading(false);
      } else {
        alert('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  const updateLocation = async () => {
    if (!location || !rider?.rider_id) return;

    try {
      const response = await fetch(`http://localhost:5001/api/rider/${rider.rider_id}/location`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          zone: currentZone
        })
      });

      if (response.ok) {
        // Store zone in localStorage
        localStorage.setItem('currentZone', currentZone);
        setIsOnline(true);
        setShowLocationModal(false);
        fetchAvailableOrders();
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const fetchAvailableOrders = async () => {
    if (!rider?.rider_id) return;
    
    // Get current zone from localStorage
    const storedZone = localStorage.getItem('currentZone');
    if (!storedZone) {
      console.log('No zone set, cannot fetch orders');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5001/api/rider/${rider.rider_id}/available-orders?zone=${encodeURIComponent(storedZone)}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const orders = await response.json();
        setAvailableOrders(orders);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const acceptOrder = async (deliveryId) => {
    if (!rider?.rider_id) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/rider/${rider.rider_id}/accept-order`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deliveryId })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Order accepted successfully!');
        fetchAvailableOrders();
        fetchRiderData(rider.rider_id);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const setDeliveryTime = async (deliveryId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/rider/delivery/${deliveryId}/set-time`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Delivery time set: ${new Date(result.estimated_time).toLocaleTimeString()}`);
        fetchRiderData(rider.rider_id);
      }
    } catch (error) {
      console.error('Error setting delivery time:', error);
    }
  };

  const markArrival = async (deliveryId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/rider/delivery/${deliveryId}/arrival`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ riderId: rider.rider_id })
      });

      if (response.ok) {
        alert('Arrival marked successfully! Customer has been notified.');
        fetchRiderData(rider.rider_id);
      }
    } catch (error) {
      console.error('Error marking arrival:', error);
    }
  };

  const confirmPayment = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/rider/order/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentMethod: 'cash' })
      });

      if (response.ok) {
        alert('Payment confirmed! Delivery completed.');
        fetchRiderData(rider.rider_id);
      }
    } catch (error) {
        console.error('Error confirming payment:', error);
    }
  };

  const toggleAvailability = async () => {
    if (!rider?.rider_id) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/rider/${rider.rider_id}/availability`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ available: !rider.available })
      });

      if (response.ok) {
        const updatedRider = await response.json();
        setRider(updatedRider);
        localStorage.setItem('user', JSON.stringify(updatedRider));
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setShowLocationModal(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          if (error.code === 1) {
            alert('Location access denied. Please allow location access in your browser settings and try again.');
          } else if (error.code === 2) {
            alert('Location unavailable. Please check your device location settings.');
          } else if (error.code === 3) {
            alert('Location request timed out. Please try again.');
          } else {
            alert('Unable to get your location. Please try again or enter manually.');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('currentZone');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="rider-loading">
        <div className="loading-spinner"></div>
        <p>Loading rider dashboard...</p>
      </div>
    );
  }

  if (!rider) return null;

  return (
    <div className="rider-home">
      {/* Header */}
      <header className="rider-header">
        <div className="header-content">
          <div className="rider-info">
            <div className="rider-avatar">
              <span>{rider.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="rider-details">
              <h2>{rider.name}</h2>
              <p className="vehicle-info">🚚 {rider.vehicle_info}</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="status-indicators">
              <div className={`connection-status ${isOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {isOnline ? 'Connected' : 'Disconnected'}
              </div>
              <div className={`availability-status ${rider?.available ? 'available' : 'unavailable'}`}>
                <span className="status-dot"></span>
                {rider?.available ? 'Available' : 'Unavailable'}
              </div>
            </div>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="rider-nav">
        <button 
          className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-btn ${currentView === 'orders' ? 'active' : ''}`}
          onClick={() => setCurrentView('orders')}
        >
          📦 Orders
        </button>
        <button 
          className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => setCurrentView('profile')}
        >
          👤 Profile
        </button>
      </nav>

      {/* Main Content */}
      <main className="rider-main">
        {currentView === 'dashboard' && (
          <div className="dashboard-view">
            <div className="dashboard-grid">
              {/* Status Card */}
              <div className="status-card">
                <h3>Current Status</h3>
                <div className="status-content">
                  <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
                    <span className="pulse"></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </div>
                  <div className="zone-display">
                    <span>Current Zone: <strong>{currentZone || 'Not set'}</strong></span>
                    <button onClick={() => setShowLocationModal(true)}>
                      {currentZone ? 'Change Zone' : 'Set Zone'}
                    </button>
                  </div>
                  <div className="availability-toggle">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={rider?.available || false}
                        onChange={toggleAvailability}
                        className="toggle-input"
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-text">
                        {rider?.available ? 'Available for Orders' : 'Not Available'}
                      </span>
                    </label>
                  </div>
                  <button 
                    className="location-btn"
                    onClick={getCurrentLocation}
                  >
                    📍 Set Location
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="stats-card">
                <h3>Today's Stats</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <span className="stat-number">{currentAssignments.length}</span>
                    <span className="stat-label">Active Deliveries</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{notifications.length}</span>
                    <span className="stat-label">Notifications</span>
                  </div>
                </div>
              </div>

              {/* Current Assignments */}
              <div className="assignments-card">
                <h3>Current Deliveries</h3>
                <div className="assignments-list">
                  {currentAssignments.length === 0 ? (
                    <p className="no-data">No active deliveries</p>
                  ) : (
                    currentAssignments.map((assignment) => (
                      <div key={assignment.delivery_id} className="assignment-item">
                        <div className="assignment-header">
                          <span className="order-id">Order #{assignment.order_id}</span>
                          <span className={`status-badge ${assignment.delivery_status}`}>
                            {assignment.delivery_status}
                          </span>
                        </div>
                        <div className="assignment-details">
                          <p><strong>Customer:</strong> {assignment.customer_name}</p>
                          <p><strong>Address:</strong> {assignment.address_line}</p>
                          <p><strong>Amount:</strong> ৳{assignment.total_amount}</p>
                        </div>
                        <div className="assignment-actions">
                          {assignment.delivery_status === 'assigned' && (
                            <button 
                              className="action-btn primary"
                              onClick={() => setDeliveryTime(assignment.delivery_id)}
                            >
                              Set Delivery Time
                            </button>
                          )}
                          {assignment.delivery_status === 'out_for_delivery' && (
                            <button 
                              className="action-btn success"
                              onClick={() => markArrival(assignment.delivery_id)}
                            >
                              Mark Arrival
                            </button>
                          )}
                          {assignment.delivery_status === 'arrived' && (
                            <button 
                              className="action-btn warning"
                              onClick={() => confirmPayment(assignment.order_id)}
                            >
                              Confirm Payment
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'orders' && (
          <div className="orders-view">
            <div className="orders-header">
              <h3>Available Orders</h3>
              <button className="refresh-btn" onClick={fetchAvailableOrders}>
                🔄 Refresh
              </button>
            </div>
            <div className="orders-list">
              {availableOrders.length === 0 ? (
                <div className="no-orders">
                  <div className="no-orders-icon">📦</div>
                  <p>No orders available in your zone</p>
                  <p>Make sure your location is set correctly</p>
                </div>
              ) : (
                availableOrders.map((order) => (
                  <div key={order.delivery_id} className="order-item">
                    <div className="order-header">
                      <span className="order-id">Order #{order.order_id}</span>
                      <span className="order-amount">৳{order.total_amount}</span>
                    </div>
                    <div className="order-details">
                      <p><strong>Customer:</strong> {order.customer_name}</p>
                      <p><strong>Phone:</strong> {order.customer_phone}</p>
                      <p><strong>Address:</strong> {order.address_line}</p>
                      <p><strong>Zone:</strong> {order.zone_name}</p>
                    </div>
                    <div className="order-actions">
                      <button 
                        className="accept-btn"
                        onClick={() => acceptOrder(order.delivery_id)}
                      >
                        ✅ Accept Order
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {currentView === 'profile' && (
          <div className="profile-view">
            <div className="profile-card">
              <h3>Rider Profile</h3>
              <div className="profile-info">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{rider.name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{rider.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{rider.phone}</span>
                </div>
                <div className="info-item">
                  <label>Vehicle:</label>
                  <span>{rider.vehicle_info}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status ${rider.available ? 'available' : 'unavailable'}`}>
                    {rider.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="modal-overlay">
          <div className="location-modal">
            <div className="modal-content">
              <h3>Set Your Location & Zone</h3>
              <div className="location-fields">
                <div>
                  <label>Latitude:</label>
                  <input type="text" value={location?.latitude || ''} readOnly />
                </div>
                <div>
                  <label>Longitude:</label>
                  <input type="text" value={location?.longitude || ''} readOnly />
                </div>
                <div>
                  <label>Zone:</label>
                  <select
                    value={currentZone}
                    onChange={e => setCurrentZone(e.target.value)}
                  >
                    <option value="">Select Zone</option>
                    {ZONE_OPTIONS.map(zone => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={updateLocation} disabled={!currentZone}>Update Location</button>
                <button onClick={() => setShowLocationModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderHome;
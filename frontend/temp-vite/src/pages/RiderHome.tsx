import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Rider {
  rider_id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_info: string;
  available?: boolean;
}

interface Assignment {
  delivery_id: number;
  order_id: number;
  customer_name: string;
  address_line: string;
  total_amount: number;
  delivery_status: string;
}

interface Notification {
  id: number;
  message: string;
}

interface Order {
  delivery_id: number;
  order_id: number;
  customer_name: string;
  customer_phone: string;
  address_line: string;
  zone_name: string;
  total_amount: number;
}

const ZONE_OPTIONS = [
  'North & Northeast Dhaka',
  'South Dhaka',
  'Central Dhaka',
  'Suburban Areas'
];

const RiderHome: React.FC = () => {
  const navigate = useNavigate();
  const [rider, setRider] = useState<Rider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'orders' | 'profile'>('dashboard');
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [currentAssignments, setCurrentAssignments] = useState<Assignment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentZone, setCurrentZone] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    let user: Rider | null = null;
    
    try {
      user = userStr ? JSON.parse(userStr) : null;
    } catch {
      user = null;
    }
    
    if (!user || role !== 'rider') {
      navigate('/');
    } else {
      setRider(user);
      setIsLoading(false);
      setIsOnline(true);
      
      const storedZone = localStorage.getItem('currentZone');
      if (storedZone) {
        setCurrentZone(storedZone);
      }
      
      if (user.rider_id) {
        fetchRiderData(user.rider_id);
      } else {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          user.rider_id = Number(storedUserId);
          setRider(user);
          localStorage.setItem('user', JSON.stringify(user));
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

  const fetchRiderData = async (riderId: number) => {
    try {
      const assignmentsResponse = await fetch(`http://localhost:5000/api/rider/${riderId}/current-assignments`, {
        headers: getAuthHeaders()
      });
      if (assignmentsResponse.ok) {
        const assignments = await assignmentsResponse.json();
        setCurrentAssignments(assignments);
      }
      
      const notificationsResponse = await fetch(`http://localhost:5000/api/rider/${riderId}/notifications`, {
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

  // Fixed fetchAvailableOrders function
  const fetchAvailableOrders = async () => {
    if (!rider?.rider_id) {
      console.log('No rider ID, cannot fetch orders');
      return;
    }
    if (!currentZone) {
      console.log('No zone set, cannot fetch orders');
      setAvailableOrders([]); // Clear orders if zone is not set
      return;
    }
    try {
      console.log('Fetching available orders for:', { riderId: rider.rider_id, zone: currentZone });
      const response = await fetch(
        `http://localhost:5000/api/rider/${rider.rider_id}/available-orders?zone=${encodeURIComponent(currentZone)}`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const orders = await response.json();
        console.log('Orders fetched:', orders);
        setAvailableOrders(orders);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
      setAvailableOrders([]);
    }
  };

  // When zone or availability changes, fetch orders
  useEffect(() => {
    if (rider?.available && currentZone) {
      fetchAvailableOrders();
    }
    // eslint-disable-next-line
  }, [rider?.available, currentZone]);

  // Add location update function
  const updateLocation = async () => {
    if (!location || !rider?.rider_id) return;

    try {
      const response = await fetch(`http://localhost:5000/api/rider/${rider.rider_id}/location`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
          zone: currentZone
        })
      });

      if (response.ok) {
        localStorage.setItem('currentZone', currentZone);
        setIsOnline(true);
        setShowLocationModal(false);
        
        // Fetch available orders after setting location
        if (rider.available) {
          fetchAvailableOrders();
        }
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  // Add getCurrentLocation function
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
          alert('Unable to get your location. Please try again.');
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

  // Add acceptOrder function
  const acceptOrder = async (deliveryId: number) => {
    if (!rider?.rider_id) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/rider/${rider.rider_id}/accept-order`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deliveryId })
      });

      if (response.ok) {
        alert('Order accepted successfully!');
        fetchAvailableOrders();
        fetchRiderData(rider.rider_id);
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('currentZone');
    navigate('/');
  };

  // When setting zone
  const handleSetZone = (zone: string) => {
    setCurrentZone(zone);
    localStorage.setItem('currentZone', zone);
    setShowZoneModal(false);
    // Fetch available orders after setting zone if rider is available
    if (rider?.available) {
      fetchAvailableOrders();
    }
  };

  // When toggling availability
  const toggleAvailability = async () => {
    if (!rider?.rider_id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/rider/${rider.rider_id}/availability`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ available: !rider.available })
      });
      if (response.ok) {
        const updatedRider = await response.json();
        setRider(updatedRider);
        localStorage.setItem('user', JSON.stringify(updatedRider));
        // Fetch available orders if now available and zone is set
        if (updatedRider.available && currentZone) {
          fetchAvailableOrders();
        }
      }
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <div className="loading-spinner" />
        <p>Loading rider dashboard...</p>
      </div>
    );
  }

  if (!rider) return null;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: 'linear-gradient(135deg, #e0f7fa 0%, #fffde4 100%)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: '#00796b', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: '#fff', color: '#00796b', borderRadius: '50%', width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24 }}>
            {rider.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: 0 }}>{rider.name}</h2>
            <div style={{ fontSize: 14 }}>{rider.vehicle_info}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={{ background: '#fff', color: '#00796b', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}>
          Logout
        </button>
      </header>

      {/* Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'center', gap: 24, background: '#e0f2f1', padding: '1rem 0' }}>
        <button style={{ background: currentView === 'dashboard' ? '#00796b' : '#fff', color: currentView === 'dashboard' ? '#fff' : '#00796b', border: 'none', borderRadius: 6, padding: '0.5rem 1.5rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setCurrentView('dashboard')}>
          Dashboard
        </button>
        <button style={{ background: currentView === 'orders' ? '#00796b' : '#fff', color: currentView === 'orders' ? '#fff' : '#00796b', border: 'none', borderRadius: 6, padding: '0.5rem 1.5rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setCurrentView('orders')}>
          Orders
        </button>
        <button style={{ background: currentView === 'profile' ? '#00796b' : '#fff', color: currentView === 'profile' ? '#fff' : '#00796b', border: 'none', borderRadius: 6, padding: '0.5rem 1.5rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setCurrentView('profile')}>
          Profile
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1rem' }}>
        {currentView === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32 }}>
            {/* Status Card */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24 }}>
              <h3 style={{ marginTop: 0 }}>Current Status</h3>
              <div style={{ marginBottom: 12 }}>
                <strong>Zone:</strong> {currentZone || 'Not set'} 
                <button 
                  style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, border: '1px solid #00796b', background: '#e0f2f1', color: '#00796b', fontWeight: 600, cursor: 'pointer' }} 
                  onClick={() => setShowZoneModal(true)}
                >
                  {currentZone ? 'Change' : 'Set'}
                </button>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Online:</strong> {isOnline ? 'Yes' : 'No'}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Active Deliveries:</strong> {currentAssignments.length}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Notifications:</strong> {notifications.length}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Availability:</strong> {rider.available ? 'Available' : 'Unavailable'}
                <button 
                  onClick={toggleAvailability} 
                  style={{ 
                    marginLeft: 12, 
                    padding: '4px 12px', 
                    borderRadius: 4, 
                    border: 'none', 
                    background: rider.available ? '#10b981' : '#f59e0b', 
                    color: '#fff', 
                    fontWeight: 600, 
                    cursor: 'pointer' 
                  }}
                >
                  {rider.available ? 'Set Unavailable' : 'Set Available'}
                </button>
              </div>
              <button 
                onClick={getCurrentLocation}
                style={{ 
                  marginTop: 12, 
                  padding: '8px 16px', 
                  borderRadius: 6, 
                  border: 'none', 
                  background: '#00796b', 
                  color: '#fff', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                📍 Set Location
              </button>
            </div>
            
            {/* Assignments Card */}
            <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24, gridColumn: 'span 2' }}>
              <h3 style={{ marginTop: 0 }}>Current Deliveries</h3>
              {currentAssignments.length === 0 ? (
                <p>No active deliveries</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {currentAssignments.map(a => (
                    <li key={a.delivery_id} style={{ marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                      <div><strong>Order #{a.order_id}</strong> - {a.delivery_status}</div>
                      <div>Customer: {a.customer_name}</div>
                      <div>Address: {a.address_line}</div>
                      <div>Amount: ৳{a.total_amount}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        {currentView === 'orders' && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Available Orders</h3>
              <button 
                onClick={fetchAvailableOrders} 
                style={{ 
                  background: '#00796b', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: 6, 
                  padding: '0.5rem 1rem', 
                  fontWeight: 600, 
                  cursor: 'pointer' 
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            {!rider.available && (
              <div style={{ 
                background: '#fff3cd', 
                border: '1px solid #ffeaa7', 
                borderRadius: 6, 
                padding: '12px', 
                marginBottom: 16, 
                color: '#856404' 
              }}>
                ⚠️ You are currently unavailable. Set yourself as available to see orders.
              </div>
            )}
            
            {!currentZone && (
              <div style={{ 
                background: '#f8d7da', 
                border: '1px solid #f5c6cb', 
                borderRadius: 6, 
                padding: '12px', 
                marginBottom: 16, 
                color: '#721c24' 
              }}>
                ⚠️ Please set your zone to see available orders.
              </div>
            )}
            
            {availableOrders.length === 0 ? (
              <p>No orders available in your zone.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {availableOrders.map(order => (
                  <li key={order.delivery_id} style={{ marginBottom: 16, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <strong>Order #{order.order_id}</strong>
                      <span style={{ fontWeight: 600, color: '#00796b' }}>৳{order.total_amount}</span>
                    </div>
                    <div style={{ marginBottom: 4 }}>Customer: {order.customer_name} ({order.customer_phone})</div>
                    <div style={{ marginBottom: 4 }}>Address: {order.address_line}</div>
                    <div style={{ marginBottom: 12 }}>Zone: {order.zone_name}</div>
                    <button 
                      onClick={() => acceptOrder(order.delivery_id)}
                      style={{ 
                        background: '#10b981', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: 6, 
                        padding: '0.5rem 1rem', 
                        fontWeight: 600, 
                        cursor: 'pointer' 
                      }}
                    >
                      ✅ Accept Order
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        
        {currentView === 'profile' && rider && (
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #0001', padding: 24, maxWidth: 500, margin: '0 auto' }}>
            <h3>Rider Profile</h3>
            <div style={{ marginBottom: 8 }}><strong>Name:</strong> {rider.name}</div>
            <div style={{ marginBottom: 8 }}><strong>Email:</strong> {rider.email}</div>
            <div style={{ marginBottom: 8 }}><strong>Phone:</strong> {rider.phone}</div>
            <div style={{ marginBottom: 8 }}><strong>Vehicle:</strong> {rider.vehicle_info}</div>
            <div style={{ marginBottom: 8 }}><strong>Status:</strong> {rider.available ? 'Available' : 'Unavailable'}</div>
          </div>
        )}
      </main>

      {/* Zone Selection Modal */}
      {showZoneModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 320, boxShadow: '0 2px 16px #0002' }}>
            <h3>Select Your Zone</h3>
            <select 
              value={currentZone} 
              onChange={e => setCurrentZone(e.target.value)} 
              style={{ width: '100%', padding: 8, margin: '16px 0', borderRadius: 6, border: '1px solid #ccc' }}
            >
              <option value="">Select Zone</option>
              {ZONE_OPTIONS.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setShowZoneModal(false)} 
                style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSetZone(currentZone)} 
                disabled={!currentZone}
                style={{ background: currentZone ? '#00796b' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, cursor: currentZone ? 'pointer' : 'not-allowed' }}
              >
                Set Zone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 400, boxShadow: '0 2px 16px #0002' }}>
            <h3>Set Your Location & Zone</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Latitude:</label>
              <input type="text" value={location?.latitude || ''} readOnly style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Longitude:</label>
              <input type="text" value={location?.longitude || ''} readOnly style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>Zone:</label>
              <select
                value={currentZone}
                onChange={e => setCurrentZone(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="">Select Zone</option>
                {ZONE_OPTIONS.map(zone => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button 
                onClick={() => setShowLocationModal(false)} 
                style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={updateLocation} 
                disabled={!currentZone}
                style={{ background: currentZone ? '#00796b' : '#ccc', color: '#fff', border: 'none', borderRadius: 6, padding: '0.5rem 1.2rem', fontWeight: 600, cursor: currentZone ? 'pointer' : 'not-allowed' }}
              >
                Update Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderHome;
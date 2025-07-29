import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Container,
  AppBar,
  Toolbar,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Badge
} from '@mui/material';
import {
  LocationOn,
  DirectionsBike,
  Person,
  Logout,
  Refresh,
  CheckCircle,
  Cancel,
  Payment,
  Notifications,
  Warning,
  Info
} from '@mui/icons-material';

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
  order_status: string;
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
    
    console.log('User data from localStorage:', userStr);
    console.log('Role from localStorage:', role);
    
    if (!userStr) {
      console.log('No user data found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Parsed user data:', user);
      
      // Check if user is a rider (either from user.role or localStorage role)
      const isRider = user.role === 'rider' || role === 'rider';
      
      if (!isRider) {
        console.log('User is not a rider, redirecting to login');
        navigate('/login');
        return;
      }

      console.log('User is a rider, fetching rider data');
      const riderId = user.rider_id || user.id;
      console.log('Using rider_id:', riderId);
      
      setRider(user);
      setIsLoading(false);
      setIsOnline(user.available || false);
      
      const storedZone = localStorage.getItem('currentZone');
      if (storedZone) {
        setCurrentZone(storedZone);
      }
      
      fetchRiderData(riderId);
      fetchAvailableOrders();
      fetchCurrentAssignments();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
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
    console.log('Fetching rider data for rider_id:', riderId);
    try {
      const response = await fetch(`http://localhost:5001/api/rider/${riderId}/profile`, {
        headers: getAuthHeaders()
      });

      console.log('Rider data response status:', response.status);
      
      if (response.ok) {
        const riderData = await response.json();
        console.log('Rider data received:', riderData);
        setRider(riderData);
        setIsOnline(riderData.available || false);
      } else if (response.status === 404) {
        console.error('Rider profile not found, status:', response.status);
        // Create a basic rider object from user data
        const userStr = localStorage.getItem('user');
        const user = JSON.parse(userStr);
        setRider({
          rider_id: user.rider_id || user.id,
          name: user.name || 'Rider',
          email: user.email,
          phone: user.phone || '',
          vehicle_info: 'Vehicle information not available',
          available: false
        });
      } else {
        console.error('Failed to fetch rider data, status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching rider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        `http://localhost:5001/api/rider/${rider.rider_id}/available-orders?zone=${encodeURIComponent(currentZone)}`,
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

  const fetchCurrentAssignments = async () => {
    if (!rider?.rider_id) {
      console.log('No rider ID, cannot fetch assignments');
      return;
    }
    try {
      console.log('Fetching current assignments for rider:', rider.rider_id);
      const response = await fetch(
        `http://localhost:5001/api/rider/${rider.rider_id}/current-assignments`,
        { headers: getAuthHeaders() }
      );
      if (response.ok) {
        const assignments = await response.json();
        console.log('Current assignments fetched:', assignments);
        setCurrentAssignments(assignments);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        setCurrentAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching current assignments:', error);
      setCurrentAssignments([]);
    }
  };

  // When zone or availability changes, fetch orders
  useEffect(() => {
    if (rider?.available && currentZone) {
      fetchAvailableOrders();
    }
    // Fetch current assignments when rider data changes
    if (rider?.rider_id) {
      fetchCurrentAssignments();
    }
    // eslint-disable-next-line
  }, [rider?.available, currentZone, rider?.rider_id]);

  // Add auto-refresh effect
  useEffect(() => {
    if (currentView === 'dashboard') {
      const interval = setInterval(() => {
        fetchRiderData(rider?.rider_id);
        fetchAvailableOrders();
        fetchCurrentAssignments();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [currentView, rider?.rider_id, currentZone]);

  // Add location update function
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
      const response = await fetch(`http://localhost:5001/api/rider/${rider.rider_id}/accept-order`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deliveryId })
      });

      if (response.ok) {
        alert('Order accepted successfully!');
        fetchAvailableOrders();
        fetchRiderData(rider.rider_id);
        fetchCurrentAssignments(); // Fetch updated assignments after accepting order
      }
    } catch (error) {
      console.error('Error accepting order:', error);
    }
  };

  // Add markArrival function
  const markArrival = async (deliveryId: number) => {
    if (!rider?.rider_id) return;
    try {
      const response = await fetch(`http://localhost:5001/api/rider/delivery/${deliveryId}/arrival`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ riderId: rider.rider_id })
      });
      if (response.ok) {
        alert('Arrival marked successfully!');
        fetchRiderData(rider.rider_id);
        fetchCurrentAssignments(); // Fetch updated assignments after marking arrival
      } else {
        const error = await response.json();
        alert('Failed to mark arrival: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking arrival:', error);
      alert('Error marking arrival.');
    }
  };

  // Add confirmPayment function
  const confirmPayment = async (orderId: number) => {
    if (!rider?.rider_id) return;
    try {
      const response = await fetch(`http://localhost:5001/api/rider/order/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentMethod: 'cash', riderId: rider.rider_id })
      });
      if (response.ok) {
        alert('Payment confirmed and delivery completed!');
        fetchRiderData(rider.rider_id);
        fetchCurrentAssignments(); // Fetch updated assignments after confirming payment
      } else {
        const error = await response.json();
        alert('Failed to confirm payment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert('Error confirming payment.');
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
      const response = await fetch(`http://localhost:5001/api/rider/${rider.rider_id}/availability`, {
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

  const markAsFailed = async (deliveryId: number) => {
    if (!rider?.rider_id) return;
    try {
      const response = await fetch(`http://localhost:5001/api/rider/delivery/${deliveryId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ delivery_status: 'failed', order_status: 'cancelled', riderId: rider.rider_id })
      });
      if (response.ok) {
        alert('Marked as failed and customer notified.');
        fetchRiderData(rider.rider_id);
        fetchCurrentAssignments(); // Fetch updated assignments after marking as failed
      } else {
        const error = await response.json();
        alert('Failed to mark as failed: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error marking as failed:', error);
      alert('Error marking as failed.');
    }
  };

  const handleOrderCancellation = async (deliveryId: number) => {
    if (!rider?.rider_id) return;
    try {
      const response = await fetch(`http://localhost:5001/api/rider/delivery/${deliveryId}/cancel`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ riderId: rider.rider_id })
      });
      if (response.ok) {
        alert('Order cancellation processed. Please return to base.');
        fetchRiderData(rider.rider_id);
        fetchCurrentAssignments(); // Fetch updated assignments after cancellation
      } else {
        const error = await response.json();
        alert('Failed to process cancellation: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error processing cancellation:', error);
      alert('Error processing cancellation.');
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh">
        <Typography variant="h6">Loading rider dashboard...</Typography>
      </Box>
    );
  }

  if (!rider) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.dark', mr: 2 }}>
            {rider.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{rider.name}</Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <DirectionsBike sx={{ mr: 0.5, fontSize: 16 }} />
              {rider.vehicle_info}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Navigation */}
      <Paper sx={{ bgcolor: 'primary.light', mb: 3 }}>
        <Tabs
          value={currentView}
          onChange={(_, newValue) => setCurrentView(newValue)}
          centered
          sx={{ '& .MuiTab-root': { color: 'white' } }}
        >
          <Tab label="Dashboard" value="dashboard" />
          <Tab label="Orders" value="orders" />
          <Tab label="Profile" value="profile" />
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {currentView === 'dashboard' && (
          <Grid container spacing={3}>
            {/* Status Card */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Status
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Zone: {currentZone || 'Not set'}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setShowZoneModal(true)}
                      sx={{ mt: 1 }}
                    >
                      {currentZone ? 'Change' : 'Set'}
                    </Button>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Online: {isOnline ? 'Yes' : 'No'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Active Deliveries: {currentAssignments.filter(a => a.order_status !== 'restored' && a.delivery_status !== 'delivered').length}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Notifications: {notifications.length}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Availability: {rider.available ? 'Available' : 'Unavailable'}
                    </Typography>
                    <Button
                      variant="contained"
                      color={rider.available ? 'error' : 'success'}
                      size="small"
                      onClick={toggleAvailability}
                      sx={{ mt: 1 }}
                    >
                      {rider.available ? 'Set Unavailable' : 'Set Available'}
                    </Button>
                  </Box>

                  <Button
                    variant="contained"
                    startIcon={<LocationOn />}
                    onClick={getCurrentLocation}
                    fullWidth
                  >
                    Set Location
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            
            {/* Assignments Card */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="h6" gutterBottom>
                      Current Deliveries
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Refresh />}
                      onClick={() => {
                        fetchRiderData(rider?.rider_id);
                        fetchAvailableOrders();
                        fetchCurrentAssignments();
                      }}
                    >
                      Refresh
                    </Button>
                  </Box>
                  {currentAssignments.length === 0 ? (
                    <Typography color="text.secondary">
                      No active deliveries
                    </Typography>
                  ) : (
                    <List>
                      {currentAssignments
                        .filter(a => a.order_status !== 'restored' && a.delivery_status !== 'delivered')
                        .map(a => (
                        <ListItem key={a.delivery_id} sx={{ borderBottom: '1px solid #eee', paddingBottom: 2 }}>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1">
                                <strong>Order #{a.order_id}</strong> - {a.delivery_status}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2">
                                  Customer: {a.customer_name}
                                </Typography>
                                <Typography variant="body2">
                                  Address: {a.address_line}
                                </Typography>
                                <Typography variant="body2">
                                  Amount: ৳{a.total_amount}
                                </Typography>
                                
                                {a.delivery_status === 'failed' ? (
                                  <Typography color="error" sx={{ mt: 1 }}>
                                    Order failed. Please return items to inventory.
                                  </Typography>
                                ) : (
                                  <Box sx={{ mt: 1 }}>
                                    {a.delivery_status === 'assigned' && (
                                      <Button
                                        variant="contained"
                                        color="error"
                                        size="small"
                                        onClick={() => handleOrderCancellation(a.delivery_id)}
                                        sx={{ mr: 1, mb: 1 }}
                                      >
                                        🚫 Order Cancelled
                                      </Button>
                                    )}
                                    {a.delivery_status === 'out_for_delivery' && (
                                      <Button
                                        variant="contained"
                                        color="warning"
                                        size="small"
                                        onClick={() => confirmPayment(a.order_id)}
                                        sx={{ mr: 1, mb: 1 }}
                                      >
                                        💰 Mark as Delivered
                                      </Button>
                                    )}
                                    {a.delivery_status === 'delivered' && (
                                      <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        onClick={() => confirmPayment(a.order_id)}
                                        sx={{ mr: 1, mb: 1 }}
                                      >
                                        💰 Mark as Delivered
                                      </Button>
                                    )}
                                    {a.delivery_status !== 'out_for_delivery' && a.delivery_status !== 'failed' && a.delivery_status !== 'delivered' && (
                                      <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        onClick={() => markArrival(a.delivery_id)}
                                        sx={{ mr: 1, mb: 1 }}
                                      >
                                        🚚 Mark Arrived
                                      </Button>
                                    )}
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
        
        {currentView === 'orders' && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Available Orders
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchAvailableOrders}
                >
                  Refresh
                </Button>
              </Box>
              
              {!rider.available && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You are currently unavailable. Set yourself as available to see orders.
                </Alert>
              )}
              
              {!currentZone && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  Please set your zone to see available orders.
                </Alert>
              )}
              
              {availableOrders.length === 0 ? (
                <Typography color="text.secondary">
                  No orders available in your zone.
                </Typography>
              ) : (
                <List>
                  {availableOrders.map((order, index) => (
                    <Box key={order.delivery_id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Typography variant="h6">
                              Order #{order.order_id} - ৳{order.total_amount}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body2">
                              Customer: {order.customer_name} ({order.customer_phone})
                              <br />
                              Address: {order.address_line}
                              <br />
                              Zone: {order.zone_name}
                            </Typography>
                          }
                        />
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => acceptOrder(order.delivery_id)}
                        >
                          Accept Order
                        </Button>
                      </ListItem>
                      {index < availableOrders.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}
        
        {currentView === 'profile' && rider && (
          <Card sx={{ maxWidth: 500, mx: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rider Profile
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Name:</strong> {rider.name}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Email:</strong> {rider.email}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Phone:</strong> {rider.phone}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Vehicle:</strong> {rider.vehicle_info}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Status:</strong> {rider.available ? 'Available' : 'Unavailable'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Zone Selection Modal */}
      <Dialog open={showZoneModal} onClose={() => setShowZoneModal(false)}>
        <DialogTitle>Select Your Zone</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Zone</InputLabel>
            <Select
              value={currentZone}
              onChange={(e) => setCurrentZone(e.target.value)}
              label="Zone"
            >
              {ZONE_OPTIONS.map(zone => (
                <MenuItem key={zone} value={zone}>{zone}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowZoneModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSetZone(currentZone)}
            disabled={!currentZone}
          >
            Set Zone
          </Button>
        </DialogActions>
      </Dialog>

      {/* Location Modal */}
      <Dialog open={showLocationModal} onClose={() => setShowLocationModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Your Location & Zone</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Latitude"
              value={location?.latitude || ''}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Longitude"
              value={location?.longitude || ''}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Zone</InputLabel>
              <Select
                value={currentZone}
                onChange={(e) => setCurrentZone(e.target.value)}
                label="Zone"
              >
                {ZONE_OPTIONS.map(zone => (
                  <MenuItem key={zone} value={zone}>{zone}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLocationModal(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={updateLocation}
            disabled={!currentZone}
          >
            Update Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RiderHome;
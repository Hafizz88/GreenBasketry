import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  LocalShipping,
  AttachMoney,
  Speed,
  CheckCircle,
  Cancel,
  Refresh,
  Visibility,
  Assessment
} from '@mui/icons-material';

interface RiderStats {
  rider_id: number;
  name: string;
  phone: string;
  email: string;
  vehicle_info: string;
  available: boolean;
  today_deliveries: number;
  today_amount: number;
  period_deliveries: number;
  period_amount: number;
  total_deliveries: number;
  total_amount: number;
  failed_deliveries: number;
  success_rate: number;
  avg_delivery_time_minutes: number;
  last_delivery_date: string;
  active_deliveries: number;
  delivery_history: DeliveryHistory[];
}

interface DeliveryHistory {
  order_id: number;
  order_date: string;
  total_amount: number;
  delivery_status: string;
  customer_name: string;
  address_line: string;
  delivery_time_minutes: number;
}

const RiderStats: React.FC = () => {
  const [riders, setRiders] = useState<RiderStats[]>([]);
  const [selectedRider, setSelectedRider] = useState<RiderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [currentTab, setCurrentTab] = useState(0);

  const fetchRidersWithStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/riders-with-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRiders(data);
      } else {
        setError('Failed to fetch rider statistics');
      }
    } catch (err) {
      setError('Error fetching rider statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderDetailedStats = async (riderId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/rider-stats/${riderId}?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRider(data);
      } else {
        setError('Failed to fetch detailed rider statistics');
      }
    } catch (err) {
      setError('Error fetching detailed rider statistics');
    }
  };

  useEffect(() => {
    fetchRidersWithStats();
  }, []);

  useEffect(() => {
    if (selectedRider) {
      fetchRiderDetailedStats(selectedRider.rider_id);
    }
  }, [period, selectedRider?.rider_id]);

  const handleRiderSelect = (rider: RiderStats) => {
    setSelectedRider(rider);
    setCurrentTab(0);
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined) return '৳0.00';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '৳0.00';
    return `৳${numAmount.toFixed(2)}`;
  };

  const formatTime = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'failed': return 'error';
      case 'out_for_delivery': return 'warning';
      case 'assigned': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Rider Statistics
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchRidersWithStats}
        >
          Refresh
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Riders Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                All Riders Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Riders: {riders.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Available: {riders.filter(r => r.available).length}
                </Typography>
              </Box>
              
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {riders.map((rider) => (
                  <Card
                    key={rider.rider_id}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      border: selectedRider?.rider_id === rider.rider_id ? 2 : 1,
                      borderColor: selectedRider?.rider_id === rider.rider_id ? 'primary.main' : 'divider',
                      '&:hover': { borderColor: 'primary.main' }
                    }}
                    onClick={() => handleRiderSelect(rider)}
                  >
                    <CardContent sx={{ py: 1.5 }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {rider.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rider.vehicle_info}
                          </Typography>
                        </Box>
                        <Chip
                          label={rider.available ? 'Available' : 'Unavailable'}
                          color={rider.available ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          Today: {rider.today_deliveries} deliveries ({formatCurrency(rider.today_amount)})
                        </Typography>
                        <Typography variant="caption" display="block">
                          Success Rate: {rider.success_rate}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Stats */}
        <Grid item xs={12} md={8}>
          {selectedRider ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      {selectedRider.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedRider.email} • {selectedRider.phone}
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedRider.available ? 'Available' : 'Unavailable'}
                    color={selectedRider.available ? 'success' : 'default'}
                  />
                </Box>

                <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
                  <Tab label="Overview" />
                  <Tab label="Delivery History" />
                </Tabs>

                {currentTab === 0 && (
                  <Grid container spacing={3}>
                    {/* Today's Stats */}
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center">
                            <LocalShipping sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="h6">{selectedRider.today_deliveries}</Typography>
                              <Typography variant="caption">Today's Deliveries</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center">
                            <AttachMoney sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="h6">{formatCurrency(selectedRider.today_amount)}</Typography>
                              <Typography variant="caption">Today's Amount</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center">
                            <Speed sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="h6">{formatTime(selectedRider.avg_delivery_time_minutes)}</Typography>
                              <Typography variant="caption">Avg Delivery Time</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                        <CardContent>
                          <Box display="flex" alignItems="center">
                            <TrendingUp sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="h6">{selectedRider.success_rate}%</Typography>
                              <Typography variant="caption">Success Rate</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Period Filter */}
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography variant="subtitle1">Period:</Typography>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value as 'today' | 'week' | 'month')}
                          >
                            <MenuItem value="today">Today</MenuItem>
                            <MenuItem value="week">This Week</MenuItem>
                            <MenuItem value="month">This Month</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                    </Grid>

                    {/* Detailed Stats */}
                    <Grid item xs={12}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Period Statistics
                              </Typography>
                              <Box>
                                <Typography variant="body2">
                                  Deliveries: {selectedRider.period_deliveries}
                                </Typography>
                                <Typography variant="body2">
                                  Amount: {formatCurrency(selectedRider.period_amount)}
                                </Typography>
                                <Typography variant="body2">
                                  Active Deliveries: {selectedRider.active_deliveries}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Card>
                            <CardContent>
                              <Typography variant="h6" gutterBottom>
                                Overall Statistics
                              </Typography>
                              <Box>
                                <Typography variant="body2">
                                  Total Deliveries: {selectedRider.total_deliveries}
                                </Typography>
                                <Typography variant="body2">
                                  Total Amount: {formatCurrency(selectedRider.total_amount)}
                                </Typography>
                                <Typography variant="body2">
                                  Failed Deliveries: {selectedRider.failed_deliveries}
                                </Typography>
                                <Typography variant="body2">
                                  Last Delivery: {selectedRider.last_delivery_date ? new Date(selectedRider.last_delivery_date).toLocaleDateString() : 'N/A'}
                                </Typography>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                )}

                {currentTab === 1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Recent Delivery History
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedRider.delivery_history.map((delivery) => (
                            <TableRow key={delivery.order_id}>
                              <TableCell>#{delivery.order_id}</TableCell>
                              <TableCell>
                                {new Date(delivery.order_date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{delivery.customer_name}</TableCell>
                              <TableCell>{delivery.address_line}</TableCell>
                              <TableCell>{formatCurrency(delivery.total_amount)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={delivery.delivery_status}
                                  color={getStatusColor(delivery.delivery_status) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{formatTime(delivery.delivery_time_minutes)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Select a Rider
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a rider from the list to view detailed statistics
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default RiderStats; 
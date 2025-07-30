import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ShoppingCart as OrdersIcon,
  Inventory as ProductsIcon,
  People as CustomersIcon,
  TrendingUp as StatsIcon,
  Add as AddIcon,
  LocalOffer as CouponsIcon,
  Discount as DiscountIcon,
  Report as ComplaintsIcon,
  Assessment as RiderStatsIcon,
  History as ActivityLogsIcon,
  AttachMoney as RevenueIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

interface DashboardStats {
  total_orders: number;
  total_products: number;
  total_customers: number;
  total_riders: number;
  total_admins: number;
  today_orders: number;
  pending_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  pending_complaints: number;
  active_riders: number;
  in_stock_products: number;
  out_of_stock_products: number;
  total_revenue: number;
  today_revenue: number;
}

interface RecentOrder {
  order_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  customer_name: string;
}

interface TopProduct {
  name: string;
  product_id: number;
  times_purchased: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  topProducts: TopProduct[];
}

const DashboardHome: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
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

  if (!dashboardData) {
    return (
      <Alert severity="warning">
        No dashboard data available
      </Alert>
    );
  }

  const { stats, recentOrders, topProducts } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Welcome back, Admin! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Here's what's happening with your e-commerce platform today
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <OrdersIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_orders}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Orders
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.today_orders} new today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <RevenueIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {formatCurrency(stats.total_revenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Revenue
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {formatCurrency(stats.today_revenue)} today
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ed6c02 0%, #e65100 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ProductsIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_products}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Products
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.in_stock_products} in stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CustomersIcon sx={{ mr: 1, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stats.total_customers}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Total Customers
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {stats.active_riders} active riders
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Stats Row */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="primary.main">
              {stats.pending_orders}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending Orders
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="success.main">
              {stats.delivered_orders}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Delivered Orders
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="error.main">
              {stats.cancelled_orders}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cancelled Orders
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="warning.main">
              {stats.pending_complaints}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending Complaints
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="info.main">
              {stats.active_riders}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Active Riders
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="h6" color="error.main">
              {stats.out_of_stock_products}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Out of Stock
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity and Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Orders */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <OrdersIcon sx={{ mr: 1 }} />
                Recent Orders
              </Typography>
              {recentOrders.length > 0 ? (
                <List>
                  {recentOrders.map((order, index) => (
                    <React.Fragment key={order.order_id}>
                      <ListItem>
                        <ListItemText
                          primary={`Order #${order.order_id} - ${order.customer_name}`}
                          secondary={`${formatCurrency(order.total_amount)} • ${order.order_status} • ${formatDate(order.order_date)}`}
                        />
                        <Chip 
                          label={order.order_status} 
                          color={order.order_status === 'delivered' ? 'success' : order.order_status === 'pending' ? 'warning' : 'default'}
                          size="small"
                        />
                      </ListItem>
                      {index < recentOrders.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No recent orders</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <ProductsIcon sx={{ mr: 1 }} />
                Top Selling Products
              </Typography>
              {topProducts.length > 0 ? (
                <List>
                  {topProducts.map((product, index) => (
                    <React.Fragment key={product.product_id}>
                      <ListItem>
                        <ListItemText
                          primary={product.name}
                          secondary={`Purchased ${product.times_purchased} times`}
                        />
                        <Chip 
                          label={`${product.times_purchased} sales`} 
                          color="primary"
                          size="small"
                        />
                      </ListItem>
                      {index < topProducts.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary">No product sales data</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/admin/add-product"
              variant="contained"
              startIcon={<AddIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              Add Product
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/admin/coupons"
              variant="outlined"
              startIcon={<CouponsIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              Manage Coupons
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/admin/complaints"
              variant="outlined"
              startIcon={<ComplaintsIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              View Complaints
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              component={Link}
              to="/admin/rider-stats"
              variant="outlined"
              startIcon={<RiderStatsIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              Rider Stats
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardHome; 
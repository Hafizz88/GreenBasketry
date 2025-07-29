import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  AttachMoney as RevenueIcon,
  Discount as DiscountIcon,
  LocalShipping as DeliveryIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface SalesData {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_discounts: number;
  total_delivery_fees: number;
}

interface TopProduct {
  name: string;
  product_id: number;
  times_purchased: number;
  total_revenue: number;
}

interface CategorySale {
  category: string;
  orders_count: number;
  category_revenue: number;
}

interface OverallStats {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  unique_customers: number;
  total_discounts: number;
  total_delivery_fees: number;
}

interface RecentOrder {
  order_id: number;
  order_date: string;
  total_amount: number;
  order_status: string;
  customer_name: string;
  items_count: number;
}

interface SalesReportData {
  period: string;
  salesData: SalesData[];
  topProducts: TopProduct[];
  categorySales: CategorySale[];
  overallStats: OverallStats;
  recentOrders: RecentOrder[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const SalesReport: React.FC = () => {
  const [data, setData] = useState<SalesReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('week');

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      console.log('Fetching sales report for period:', period);
      
      const response = await fetch(`http://localhost:5001/api/admin/sales-report?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const reportData = await response.json();
        console.log('Sales report data received:', reportData);
        setData(reportData);
      } else {
        const errorData = await response.json();
        console.error('Sales report API error:', errorData);
        setError(`Failed to fetch sales report: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error fetching sales report:', err);
      setError('Failed to load sales report. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReport();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return `৳${Number(amount).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">No sales data available for the selected period.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Sales Report
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value)}
          >
            <MenuItem value="week">Last Week</MenuItem>
            <MenuItem value="month">Last Month</MenuItem>
            <MenuItem value="year">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overall Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <RevenueIcon sx={{ color: 'primary.main', mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(data.overallStats.total_revenue)}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <OrdersIcon sx={{ color: 'success.main', mr: 1 }} />
                <Box>
                  <Typography variant="h6">{data.overallStats.total_orders}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CustomersIcon sx={{ color: 'info.main', mr: 1 }} />
                <Box>
                  <Typography variant="h6">{data.overallStats.unique_customers}</Typography>
                  <Typography variant="body2" color="text.secondary">Unique Customers</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ color: 'warning.main', mr: 1 }} />
                <Box>
                  <Typography variant="h6">{formatCurrency(data.overallStats.avg_order_value)}</Typography>
                  <Typography variant="body2" color="text.secondary">Avg Order Value</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      {data.salesData && data.salesData.length > 0 && (
        <>
          {/* Sales Trend Chart - Full Width */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sales Trend</Typography>
              <Box sx={{ height: 500, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_revenue" 
                      stroke="#8884d8" 
                      name="Revenue" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_orders" 
                      stroke="#82ca9d" 
                      name="Orders" 
                      strokeWidth={3}
                      dot={{ r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Category Sales Pie Chart - Full Width */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Sales by Category</Typography>
              <Box sx={{ height: 500, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categorySales}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={180}
                      fill="#8884d8"
                      dataKey="category_revenue"
                      nameKey="category"
                    >
                      {data.categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(Number(value))}
                      labelFormatter={(label) => label}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Tables Section */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Selling Products</Typography>
              {data.topProducts && data.topProducts.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Times Purchased</TableCell>
                        <TableCell align="right">Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.topProducts.map((product) => (
                        <TableRow key={product.product_id}>
                          <TableCell>{product.name}</TableCell>
                          <TableCell align="right">{product.times_purchased}</TableCell>
                          <TableCell align="right">{formatCurrency(product.total_revenue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No top selling products data available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Orders */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Orders</Typography>
              {data.recentOrders && data.recentOrders.length > 0 ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order ID</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Items</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.recentOrders.map((order) => (
                        <TableRow key={order.order_id}>
                          <TableCell>#{order.order_id}</TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell align="right">{formatCurrency(order.total_amount)}</TableCell>
                          <TableCell align="right">{order.items_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  No recent orders data available.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SalesReport; 
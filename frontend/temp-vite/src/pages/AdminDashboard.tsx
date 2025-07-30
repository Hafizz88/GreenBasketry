import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Container,
  useTheme,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Add as AddIcon,
  LocalOffer as CouponsIcon,
  Discount as DiscountIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as OrdersIcon,
  People as PeopleIcon,
  Report as ComplaintsIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
  BarChart as SalesReportIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import ComplaintsAdminPage from './ComplaintsAdminPage';
import { logout, getCurrentUser } from '../utils/auth';

// Constants
const drawerWidth = 280;
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

type NavLink = {
  to: string;
  label: string;
  icon: React.ReactNode;
};

const navLinks: NavLink[] = [
  { to: 'products', label: 'Manage Products', icon: <InventoryIcon /> },
  { to: 'add-product', label: 'Add New Product', icon: <AddIcon /> },
  { to: 'coupons', label: 'Manage Coupons', icon: <CouponsIcon /> },
  { to: 'set-discount', label: 'Set Product Discount', icon: <DiscountIcon /> },
  { to: 'sales-report', label: 'Sales Report', icon: <SalesReportIcon /> },
  { to: 'complaints', label: 'Manage Complaints', icon: <ComplaintsIcon /> },
  { to: 'cancelled-orders', label: 'Cancelled Orders', icon: <OrdersIcon /> },
  { to: 'manage-riders', label: 'Manage Riders', icon: <PeopleIcon /> },
  { to: 'manage-admins', label: 'Manage Admins', icon: <AdminIcon /> },
  { to: 'rider-stats', label: 'Rider Statistics', icon: <AssessmentIcon /> },
  { to: 'activity-logs', label: 'Activity Logs', icon: <HistoryIcon /> },
];
// Remove or comment out any navLinks that do not match a real route in App.tsx

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

const AdminDashboardContent: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const currentUser = getCurrentUser();
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
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

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      logout();
    }
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Tooltip title="Click to go to main dashboard" placement="right">
        <Box
          sx={{
            p: 3,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
              transition: 'background 0.3s ease',
            },
          }}
          component={Link}
          to=""
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '1.5rem',
            }}
          >
            👨‍💼
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <HomeIcon sx={{ fontSize: 20 }} />
            Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
            GreenBasketry Management
          </Typography>
          {currentUser && (
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              Logged in as: {currentUser.name || currentUser.email || 'Admin'}
            </Typography>
          )}
        </Box>
      </Tooltip>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, pt: 2 }}>
        {navLinks.map((link) => {
          const isActive = location.pathname.includes(link.to);
          return (
            <ListItem key={link.to} disablePadding sx={{ mb: 1, mx: 2 }}>
              <ListItemButton
                component={Link}
                to={link.to}
                sx={{
                  borderRadius: 2,
                  backgroundColor: isActive ? 'primary.main' : 'transparent',
                  color: isActive ? 'white' : 'text.primary',
                  '&:hover': {
                    backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                  },
                  '& .MuiListItemIcon-root': {
                    color: isActive ? 'white' : 'text.secondary',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {link.icon}
                </ListItemIcon>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{
            mb: 2,
            borderColor: 'error.main',
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'white',
              borderColor: 'error.main',
            },
          }}
        >
          Logout
        </Button>
        <Typography variant="body2" color="text.secondary" align="center">
          © 2024 GreenBasketry
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            display: { xs: 'block', sm: 'none' },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              <Link to="" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 1 }}>
                <HomeIcon sx={{ fontSize: 20 }} />
                Admin Dashboard
              </Link>
            </Typography>
            <IconButton
              color="inherit"
              onClick={handleLogout}
              aria-label="logout"
            >
              <LogoutIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      {/* Desktop Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
          minHeight: '100vh',
        }}
      >
        <Toolbar /> {/* Spacer for mobile app bar */}

        {/* Welcome Header */}
        <Container maxWidth="xl" sx={{ mb: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ flex: { xs: 'none', md: 1 } }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                  Welcome back, Admin! 👋
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Manage your e-commerce platform with powerful tools and insights
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<span>📈</span>}
                    label="Active Orders"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<span>📦</span>}
                    label="Products"
                    color="secondary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<span>👥</span>}
                    label="Customers"
                    color="success"
                    variant="outlined"
                  />
                </Box>
              </Box>
              <Box sx={{ flex: { xs: 'none', md: 1 }, textAlign: { xs: 'left', md: 'right' } }}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: { xs: 'flex-start', md: 'flex-end' },
                    gap: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<LogoutIcon />}
                      onClick={handleLogout}
                      sx={{
                        borderColor: 'error.main',
                        color: 'error.main',
                        '&:hover': {
                          backgroundColor: 'error.main',
                          color: 'white',
                          borderColor: 'error.main',
                        },
                      }}
                    >
                      Logout
                    </Button>
                  </Box>
                  <Typography variant="h6" color="text.secondary">
                    Quick Stats
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, maxWidth: 200 }}>
                    <Card sx={{ textAlign: 'center', py: 1, flex: 1 }}>
                      <Typography variant="h6" color="primary.main">
                        {loading ? '...' : dashboardStats?.total_orders || '--'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Orders
                      </Typography>
                    </Card>
                    <Card sx={{ textAlign: 'center', py: 1, flex: 1 }}>
                      <Typography variant="h6" color="secondary.main">
                        {loading ? '...' : dashboardStats?.total_products || '--'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Products
                      </Typography>
                    </Card>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Container>

        {/* Page Content */}
        <Container maxWidth="xl">
          {/* Breadcrumb Navigation */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Link to="" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Chip
                icon={<HomeIcon />}
                label="Dashboard"
                color="primary"
                variant="outlined"
                clickable
                sx={{ '&:hover': { backgroundColor: 'primary.main', color: 'white' } }}
              />
            </Link>
            {location.pathname !== '/admin/dashboard' && (
              <>
                <Typography variant="body2" color="text.secondary">/</Typography>
                <Chip
                  label={navLinks.find(link => location.pathname.includes(link.to))?.label || 'Current Page'}
                  variant="outlined"
                  color="secondary"
                />
              </>
            )}
          </Box>
          
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: 'white',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              minHeight: '60vh',
            }}
          >
            <Outlet />
          </Paper>
        </Container>
      </Box>
    </Box>
  );
};

const AdminDashboard: React.FC = () => {
  return (
    <ThemeProvider theme={muiTheme} {...({} as any)}>
      <CssBaseline />
      <AdminDashboardContent />
    </ThemeProvider>
  );
};

export default AdminDashboard;

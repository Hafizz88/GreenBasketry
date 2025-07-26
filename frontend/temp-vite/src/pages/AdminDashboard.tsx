import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
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
  Paper,
  Container,
  Card,
  CardContent,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';



// Icons temporarily removed to fix import issues

const drawerWidth = 280;

// Material UI theme for admin dashboard
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
  },
});

const navLinks = [
  { to: 'dashboard', label: 'Dashboard', icon: <span>📊</span> },
  { to: 'products', label: 'Manage Products', icon: <span>📦</span> },
  { to: 'add-product', label: 'Add New Product', icon: <span>➕</span> },
  { to: 'coupons', label: 'Manage Coupons', icon: <span>🎫</span> },
  { to: 'set-discount', label: 'Set Product Discount', icon: <span>💰</span> },
];

const AdminDashboardContent: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          textAlign: 'center',
        }}
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
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          Admin Panel
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          GreenBasketry Management
        </Typography>
      </Box>

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
              ☰
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Admin Dashboard
            </Typography>
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
                  <Typography variant="h6" color="text.secondary">
                    Quick Stats
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, maxWidth: 200 }}>
                    <Card sx={{ textAlign: 'center', py: 1, flex: 1 }}>
                      <Typography variant="h6" color="primary.main">
                        24
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Orders
                      </Typography>
                    </Card>
                    <Card sx={{ textAlign: 'center', py: 1, flex: 1 }}>
                      <Typography variant="h6" color="secondary.main">
                        156
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
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AdminDashboardContent />
    </ThemeProvider>
  );
};

export default AdminDashboard; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  DirectionsBike as BikeIcon
} from '@mui/icons-material';

interface Rider {
  rider_id: number;
  name: string;
  email: string;
  phone: string;
  vehicle_info: string;
  available: boolean;
  created_at?: string;
}

interface NewRider {
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicle_info: string;
}

const ManageRiders: React.FC = () => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRider, setEditingRider] = useState<Rider | null>(null);
  const [newRider, setNewRider] = useState<NewRider>({
    name: '',
    email: '',
    password: '',
    phone: '',
    vehicle_info: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/rider/available', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRiders(data);
      } else {
        throw new Error('Failed to fetch riders');
      }
    } catch (error) {
      console.error('Error fetching riders:', error);
      showSnackbar('Failed to fetch riders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (rider?: Rider) => {
    if (rider) {
      setEditingRider(rider);
      setNewRider({
        name: rider.name,
        email: rider.email,
        password: '',
        phone: rider.phone,
        vehicle_info: rider.vehicle_info
      });
    } else {
      setEditingRider(null);
      setNewRider({
        name: '',
        email: '',
        password: '',
        phone: '',
        vehicle_info: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRider(null);
    setNewRider({
      name: '',
      email: '',
      password: '',
      phone: '',
      vehicle_info: ''
    });
  };

  const handleInputChange = (field: keyof NewRider, value: string) => {
    setNewRider(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingRider 
        ? `http://localhost:5001/api/rider/${editingRider.rider_id}/update`
        : 'http://localhost:5001/api/auth/signup';
      
      const body = editingRider 
        ? {
            name: newRider.name,
            email: newRider.email,
            phone: newRider.phone,
            vehicle_info: newRider.vehicle_info
          }
        : {
            ...newRider,
            role: 'rider'
          };

      const response = await fetch(url, {
        method: editingRider ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        showSnackbar(
          editingRider ? 'Rider updated successfully!' : 'Rider created successfully!',
          'success'
        );
        handleCloseDialog();
        fetchRiders();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save rider');
      }
    } catch (error) {
      console.error('Error saving rider:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to save rider', 'error');
    }
  };

  const handleDeleteRider = async (riderId: number) => {
    if (!window.confirm('Are you sure you want to delete this rider?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rider/${riderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showSnackbar('Rider deleted successfully!', 'success');
        fetchRiders();
      } else {
        throw new Error('Failed to delete rider');
      }
    } catch (error) {
      console.error('Error deleting rider:', error);
      showSnackbar('Failed to delete rider', 'error');
    }
  };

  const handleToggleAvailability = async (riderId: number, currentAvailable: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/rider/${riderId}/availability`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ available: !currentAvailable })
      });

      if (response.ok) {
        showSnackbar('Rider availability updated!', 'success');
        fetchRiders();
      } else {
        throw new Error('Failed to update rider availability');
      }
    } catch (error) {
      console.error('Error updating rider availability:', error);
      showSnackbar('Failed to update rider availability', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading riders...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Riders
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          Add New Rider
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Vehicle</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {riders.map((rider) => (
                  <TableRow key={rider.rider_id}>
                    <TableCell>{rider.name}</TableCell>
                    <TableCell>{rider.email}</TableCell>
                    <TableCell>{rider.phone}</TableCell>
                    <TableCell>{rider.vehicle_info}</TableCell>
                    <TableCell>
                      <Chip
                        label={rider.available ? 'Available' : 'Unavailable'}
                        color={rider.available ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleAvailability(rider.rider_id, rider.available)}
                          color="primary"
                        >
                          <BikeIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(rider)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRider(rider.rider_id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Rider Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRider ? 'Edit Rider' : 'Add New Rider'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={newRider.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newRider.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              fullWidth
              required
            />
            {!editingRider && (
              <TextField
                label="Password"
                type="password"
                value={newRider.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                fullWidth
                required
              />
            )}
            <TextField
              label="Phone"
              value={newRider.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Vehicle Information"
              value={newRider.vehicle_info}
              onChange={(e) => handleInputChange('vehicle_info', e.target.value)}
              fullWidth
              required
              placeholder="e.g., Motorcycle, Bicycle, Van"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingRider ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ManageRiders; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface Admin {
  admin_id: number;
  name: string;
  email: string;
  phone: string;
  status?: string;
}

interface NewAdmin {
  name: string;
  email: string;
  password: string;
  phone: string;
}

const ManageAdmins: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newAdmin, setNewAdmin] = useState<NewAdmin>({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/admins', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      } else {
        throw new Error('Failed to fetch admins');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      showSnackbar('Failed to fetch admins', 'error');
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

  const handleOpenDialog = (admin?: Admin) => {
    if (admin) {
      setEditingAdmin(admin);
      setNewAdmin({
        name: admin.name,
        email: admin.email,
        password: '',
        phone: admin.phone
      });
    } else {
      setEditingAdmin(null);
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        phone: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAdmin(null);
    setNewAdmin({
      name: '',
      email: '',
      password: '',
      phone: ''
    });
  };

  const handleInputChange = (field: keyof NewAdmin, value: string) => {
    setNewAdmin(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingAdmin
        ? `http://localhost:5001/api/admin/${editingAdmin.admin_id}/update`
        : 'http://localhost:5001/api/auth/signup';
      const body = editingAdmin
        ? {
            name: newAdmin.name,
            email: newAdmin.email,
            phone: newAdmin.phone
          }
        : {
            ...newAdmin,
            role: 'admin'
          };
      const response = await fetch(url, {
        method: editingAdmin ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        showSnackbar(
          editingAdmin ? 'Admin updated successfully!' : 'Admin created successfully!',
          'success'
        );
        handleCloseDialog();
        fetchAdmins();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save admin');
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to save admin', 'error');
    }
  };

  const handleDeleteAdmin = async (adminId: number) => {
    if (!window.confirm('Are you sure you want to deactivate this admin?')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/admins/${adminId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        showSnackbar('Admin deactivated successfully!', 'success');
        // Remove the admin from the local state instead of refetching
        setAdmins(prevAdmins => prevAdmins.filter(admin => admin.admin_id !== adminId));
      } else {
        throw new Error('Failed to deactivate admin');
      }
    } catch (error) {
      console.error('Error deactivating admin:', error);
      showSnackbar('Failed to deactivate admin', 'error');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Loading admins...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Manage Admins
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          Add New Admin
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
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.admin_id}>
                    <TableCell>{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{admin.phone}</TableCell>
                    <TableCell>{admin.status || 'Active'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(admin)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        {admin.admin_id !== Number(localStorage.getItem('userId')) && (
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteAdmin(admin.admin_id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      {/* Add/Edit Admin Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={newAdmin.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={newAdmin.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              fullWidth
              required
            />
            {!editingAdmin && (
              <TextField
                label="Password"
                type="password"
                value={newAdmin.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                fullWidth
                required
              />
            )}
            <TextField
              label="Phone"
              value={newAdmin.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              fullWidth
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAdmin ? 'Update' : 'Create'}
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

export default ManageAdmins; 
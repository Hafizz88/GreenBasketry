import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  TextField,
  Pagination,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Visibility,
  Add,
  Edit,
  Delete,
  Timeline,
  CalendarToday,
  Person,
  TableChart
} from '@mui/icons-material';

interface ActivityLog {
  log_id: number;
  admin_user_id: string;
  timestamp: string;
  action_type: string;
  table_name: string;
  record_id: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  description: string;
}

interface ActivitySummary {
  total_actions: number;
  unique_admins: number;
  tables_affected: number;
  action_types: number;
  create_actions: number;
  update_actions: number;
  delete_actions: number;
  today_actions: number;
  week_actions: number;
  month_actions: number;
  last_action_time: string;
}

interface TopAdmin {
  admin_user_id: string;
  action_count: number;
}

interface TopTable {
  table_name: string;
  action_count: number;
}

const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [topAdmins, setTopAdmins] = useState<TopAdmin[]>([]);
  const [topTables, setTopTables] = useState<TopTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    action_type: '',
    table_name: '',
    admin_user_id: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalLogs: 0,
    limit: 50
  });
  
  // Available filter options
  const [filterOptions, setFilterOptions] = useState({
    actionTypes: [],
    tableNames: [],
    adminUsers: []
  });
  
  // Dialog state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);

  const fetchActivityLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.limit.toString()
      });
      
      if (filters.action_type) params.append('action_type', filters.action_type);
      if (filters.table_name) params.append('table_name', filters.table_name);
      if (filters.admin_user_id) params.append('admin_user_id', filters.admin_user_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`http://localhost:5001/api/admin/activity-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setPagination(data.pagination);
        setFilterOptions(data.filters);
      } else {
        setError('Failed to fetch activity logs');
      }
    } catch (err) {
      setError('Error fetching activity logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivitySummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/activity-summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        setTopAdmins(data.topAdmins);
        setTopTables(data.topTables);
      }
    } catch (err) {
      console.error('Error fetching activity summary:', err);
    }
  };

  useEffect(() => {
    fetchActivityLogs();
    fetchActivitySummary();
  }, [pagination.currentPage, filters]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const clearFilters = () => {
    setFilters({
      action_type: '',
      table_name: '',
      admin_user_id: '',
      start_date: '',
      end_date: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return 'success';
      case 'UPDATE': return 'warning';
      case 'DELETE': return 'error';
      default: return 'default';
    }
  };

  const getActionTypeIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATE': return <Add />;
      case 'UPDATE': return <Edit />;
      case 'DELETE': return <Delete />;
      default: return <Timeline />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleViewLogDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };

  if (loading && logs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Admin Activity Logs
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(true)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              fetchActivityLogs();
              fetchActivitySummary();
            }}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      {summary && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Card sx={{ bgcolor: 'primary.light', color: 'white', minWidth: 200, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Timeline sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{summary.total_actions}</Typography>
                  <Typography variant="caption">Total Actions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'success.light', color: 'white', minWidth: 200, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{summary.unique_admins}</Typography>
                  <Typography variant="caption">Active Admins</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'warning.light', color: 'white', minWidth: 200, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TableChart sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{summary.tables_affected}</Typography>
                  <Typography variant="caption">Tables Affected</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'info.light', color: 'white', minWidth: 200, flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarToday sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{summary.today_actions}</Typography>
                  <Typography variant="caption">Today's Actions</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Top Performers */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Active Admins
            </Typography>
            {topAdmins.map((admin, index) => (
              <Box key={admin.admin_user_id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {admin.admin_user_id.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">{admin.admin_user_id}</Typography>
                </Box>
                <Chip label={admin.action_count} color="primary" size="small" />
              </Box>
            ))}
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Most Affected Tables
            </Typography>
            {topTables.map((table, index) => (
              <Box key={table.table_name} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                  {table.table_name}
                </Typography>
                <Chip label={table.action_count} color="secondary" size="small" />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* Activity Logs Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Activity Logs
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Action</TableCell>
                  <TableCell>Admin</TableCell>
                  <TableCell>Table</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      <Chip
                        icon={getActionTypeIcon(log.action_type)}
                        label={log.action_type}
                        color={getActionTypeColor(log.action_type) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 1, width: 24, height: 24, fontSize: '0.75rem' }}>
                          {log.admin_user_id.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{log.admin_user_id}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.table_name} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {log.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {formatTimestamp(log.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewLogDetails(log)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onClose={() => setShowFilters(false)} maxWidth="md" fullWidth>
        <DialogTitle>Filter Activity Logs</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Action Type</InputLabel>
              <Select
                value={filters.action_type}
                onChange={(e) => handleFilterChange('action_type', e.target.value)}
                label="Action Type"
              >
                <MenuItem value="">All Actions</MenuItem>
                {filterOptions.actionTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Table Name</InputLabel>
              <Select
                value={filters.table_name}
                onChange={(e) => handleFilterChange('table_name', e.target.value)}
                label="Table Name"
              >
                <MenuItem value="">All Tables</MenuItem>
                {filterOptions.tableNames.map((table) => (
                  <MenuItem key={table} value={table}>{table}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Admin User</InputLabel>
              <Select
                value={filters.admin_user_id}
                onChange={(e) => handleFilterChange('admin_user_id', e.target.value)}
                label="Admin User"
              >
                <MenuItem value="">All Admins</MenuItem>
                {filterOptions.adminUsers.map((admin) => (
                  <MenuItem key={admin} value={admin}>{admin}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search in descriptions..."
            />

            <TextField
              fullWidth
              size="small"
              label="Start Date"
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              fullWidth
              size="small"
              label="End Date"
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearFilters}>Clear All</Button>
          <Button onClick={() => setShowFilters(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Log Details Dialog */}
      <Dialog open={showLogDetails} onClose={() => setShowLogDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Activity Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Action Type</Typography>
                  <Chip
                    icon={getActionTypeIcon(selectedLog.action_type)}
                    label={selectedLog.action_type}
                    color={getActionTypeColor(selectedLog.action_type) as any}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Table</Typography>
                  <Typography variant="body1">{selectedLog.table_name}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Admin User</Typography>
                  <Typography variant="body1">{selectedLog.admin_user_id}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Record ID</Typography>
                  <Typography variant="body1">{selectedLog.record_id}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                  <Typography variant="body1">{selectedLog.description}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                  <Typography variant="body1">{formatTimestamp(selectedLog.timestamp)}</Typography>
                </Box>

                {selectedLog.field_name && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Field Name</Typography>
                    <Typography variant="body1">{selectedLog.field_name}</Typography>
                  </Box>
                )}

                {selectedLog.old_value && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">Old Value</Typography>
                    <Typography variant="body1">{selectedLog.old_value}</Typography>
                  </Box>
                )}

                {selectedLog.new_value && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">New Value</Typography>
                    <Typography variant="body1">{selectedLog.new_value}</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminActivityLogs; 
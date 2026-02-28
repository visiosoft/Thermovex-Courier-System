import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    Card,
    CardContent,
    Divider
} from '@mui/material';
import {
    Search as SearchIcon,
    Visibility as ViewIcon,
    CheckCircle as ResolveIcon,
    Close as CloseIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const ExceptionManagement = () => {
    const { hasPermission } = useAuth();
    const [exceptions, setExceptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [filters, setFilters] = useState({
        status: '',
        type: '',
        priority: '',
        awbNumber: ''
    });
    const [viewDialog, setViewDialog] = useState(false);
    const [selectedException, setSelectedException] = useState(null);
    const [resolveDialog, setResolveDialog] = useState(false);
    const [createDialog, setCreateDialog] = useState(false);
    const [resolutionData, setResolutionData] = useState({
        resolution: '',
        resolutionNotes: ''
    });
    const [newException, setNewException] = useState({
        awbNumber: '',
        type: '',
        priority: 'Medium',
        description: '',
        reportedBy: ''
    });

    const exceptionTypes = [
        'Damaged Package',
        'Missing Items',
        'Wrong Address',
        'Delivery Delay',
        'Package Lost',
        'Incorrect Information',
        'Delivery Refused',
        'Customer Not Available',
        'Weather Delay',
        'Vehicle Breakdown',
        'Other'
    ];

    const statusColors = {
        'Open': 'error',
        'In Progress': 'warning',
        'Resolved': 'success',
        'Closed': 'default'
    };

    const priorityColors = {
        'Low': 'default',
        'Medium': 'info',
        'High': 'warning',
        'Urgent': 'error'
    };

    useEffect(() => {
        fetchExceptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, rowsPerPage, filters]);

    const fetchExceptions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const params = {
                page: page + 1,
                limit: rowsPerPage,
                ...filters
            };

            const response = await axios.get('http://localhost:5000/api/exceptions', {
                params,
                headers: { Authorization: `Bearer ${token}` }
            });

            setExceptions(response.data.data);
            setTotalCount(response.data.pagination.total);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch exceptions');
        } finally {
            setLoading(false);
        }
    };

    const handleViewException = async (exception) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/exceptions/${exception._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSelectedException(response.data.data);
            setViewDialog(true);
        } catch (error) {
            toast.error('Failed to fetch exception details');
        }
    };

    const handleResolve = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/exceptions/${selectedException._id}/resolve`,
                resolutionData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Exception resolved successfully');
            setResolveDialog(false);
            setResolutionData({ resolution: '', resolutionNotes: '' });
            fetchExceptions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resolve exception');
        }
    };

    const handleCreateException = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/exceptions',
                newException,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Complaint created successfully');
            setCreateDialog(false);
            setNewException({
                awbNumber: '',
                type: '',
                priority: 'Medium',
                description: '',
                reportedBy: ''
            });
            fetchExceptions();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create complaint');
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
        setPage(0);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Exceptions & Complaints
                </Typography>
                <Box display="flex" gap={2}>
                    {hasPermission('complaints', 'add') && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => setCreateDialog(true)}
                        >
                            Add Complaint
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchExceptions}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="AWB Number"
                            value={filters.awbNumber}
                            onChange={(e) => handleFilterChange('awbNumber', e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Open">Open</MenuItem>
                            <MenuItem value="In Progress">In Progress</MenuItem>
                            <MenuItem value="Resolved">Resolved</MenuItem>
                            <MenuItem value="Closed">Closed</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Priority"
                            value={filters.priority}
                            onChange={(e) => handleFilterChange('priority', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="High">High</MenuItem>
                            <MenuItem value="Urgent">Urgent</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            select
                            label="Type"
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                        >
                            <MenuItem value="">All</MenuItem>
                            {exceptionTypes.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {/* Exceptions Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Exception #</TableCell>
                            <TableCell>AWB Number</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Priority</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Reported By</TableCell>
                            <TableCell>Reported At</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : exceptions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No exceptions found
                                </TableCell>
                            </TableRow>
                        ) : (
                            exceptions.map((exception) => (
                                <TableRow key={exception._id} hover>
                                    <TableCell>{exception.exceptionNumber}</TableCell>
                                    <TableCell>{exception.awbNumber}</TableCell>
                                    <TableCell>{exception.type}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={exception.priority}
                                            color={priorityColors[exception.priority]}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={exception.status}
                                            color={statusColors[exception.status]}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{exception.reportedBy?.name || 'Customer'}</TableCell>
                                    <TableCell>
                                        {new Date(exception.reportedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewException(exception)}
                                            color="primary"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        {exception.status !== 'Resolved' && exception.status !== 'Closed' && (
                                            <IconButton
                                                size="small"
                                                onClick={() => {
                                                    setSelectedException(exception);
                                                    setResolveDialog(true);
                                                }}
                                                color="success"
                                            >
                                                <ResolveIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                />
            </TableContainer>

            {/* View Exception Dialog */}
            <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    Exception Details
                    <IconButton
                        onClick={() => setViewDialog(false)}
                        sx={{ position: 'absolute', right: 8, top: 8 }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    {selectedException && (
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            {selectedException.exceptionNumber}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    AWB Number
                                                </Typography>
                                                <Typography variant="body1">
                                                    {selectedException.awbNumber}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Type
                                                </Typography>
                                                <Typography variant="body1">
                                                    {selectedException.type}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Priority
                                                </Typography>
                                                <Chip
                                                    label={selectedException.priority}
                                                    color={priorityColors[selectedException.priority]}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Status
                                                </Typography>
                                                <Chip
                                                    label={selectedException.status}
                                                    color={statusColors[selectedException.status]}
                                                    size="small"
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Description
                                                </Typography>
                                                <Typography variant="body1">
                                                    {selectedException.description}
                                                </Typography>
                                            </Grid>
                                            {selectedException.resolution && (
                                                <Grid item xs={12}>
                                                    <Divider sx={{ my: 2 }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        Resolution
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {selectedException.resolution}
                                                    </Typography>
                                                </Grid>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
            </Dialog>

            {/* Resolve Exception Dialog */}
            <Dialog open={resolveDialog} onClose={() => setResolveDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Resolve Exception</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Resolution"
                        multiline
                        rows={3}
                        value={resolutionData.resolution}
                        onChange={(e) => setResolutionData({ ...resolutionData, resolution: e.target.value })}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={2}
                        value={resolutionData.resolutionNotes}
                        onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResolveDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleResolve}>
                        Resolve
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Exception Dialog */}
            <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Complaint</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="AWB Number"
                        value={newException.awbNumber}
                        onChange={(e) => setNewException({ ...newException, awbNumber: e.target.value })}
                        sx={{ mt: 2, mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        select
                        label="Type"
                        value={newException.type}
                        onChange={(e) => setNewException({ ...newException, type: e.target.value })}
                        sx={{ mb: 2 }}
                    >
                        {exceptionTypes.map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        fullWidth
                        select
                        label="Priority"
                        value={newException.priority}
                        onChange={(e) => setNewException({ ...newException, priority: e.target.value })}
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="Low">Low</MenuItem>
                        <MenuItem value="Medium">Medium</MenuItem>
                        <MenuItem value="High">High</MenuItem>
                        <MenuItem value="Urgent">Urgent</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        label="Reported By"
                        value={newException.reportedBy}
                        onChange={(e) => setNewException({ ...newException, reportedBy: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={4}
                        value={newException.description}
                        onChange={(e) => setNewException({ ...newException, description: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreateException}>
                        Create Complaint
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExceptionManagement;

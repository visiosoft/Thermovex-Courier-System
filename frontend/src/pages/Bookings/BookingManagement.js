import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    MenuItem,
    Typography,
    InputAdornment,
    Pagination,
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    FileUpload as UploadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BookingManagement = () => {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        pages: 1,
        total: 0
    });

    const statusColors = {
        'Booked': 'info',
        'Picked Up': 'primary',
        'In Transit': 'warning',
        'Out for Delivery': 'secondary',
        'Delivered': 'success',
        'Returned': 'error',
        'Cancelled': 'default',
        'On Hold': 'warning',
        'Failed Delivery': 'error'
    };

    useEffect(() => {
        fetchBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, statusFilter, serviceTypeFilter, pagination.page]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await bookingAPI.getAll({
                search: searchTerm,
                status: statusFilter,
                serviceType: serviceTypeFilter,
                page: pagination.page,
                limit: 20
            });
            setBookings(response.data.data);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to fetch bookings');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this booking?')) return;

        try {
            await bookingAPI.delete(id);
            toast.success('Booking deleted successfully');
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete booking');
        }
    };

    const handleViewDetails = (id) => {
        navigate(`/bookings/${id}`);
    };

    const handleCreateBooking = () => {
        navigate('/bookings/create');
    };

    const handleBulkUpload = () => {
        navigate('/bookings/bulk-upload');
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold">
                    Booking Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {hasPermission('booking', 'add') && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<UploadIcon />}
                                onClick={handleBulkUpload}
                            >
                                Bulk Upload
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateBooking}
                            >
                                Create Booking
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Filters */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            placeholder="Search by AWB, reference, consignee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <MenuItem value="">All Statuses</MenuItem>
                            <MenuItem value="Booked">Booked</MenuItem>
                            <MenuItem value="Picked Up">Picked Up</MenuItem>
                            <MenuItem value="In Transit">In Transit</MenuItem>
                            <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                            <MenuItem value="Delivered">Delivered</MenuItem>
                            <MenuItem value="Returned">Returned</MenuItem>
                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                            <MenuItem value="On Hold">On Hold</MenuItem>
                            <MenuItem value="Failed Delivery">Failed Delivery</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            select
                            label="Service Type"
                            value={serviceTypeFilter}
                            onChange={(e) => setServiceTypeFilter(e.target.value)}
                        >
                            <MenuItem value="">All Services</MenuItem>
                            <MenuItem value="Express">Express</MenuItem>
                            <MenuItem value="Standard">Standard</MenuItem>
                            <MenuItem value="Economy">Economy</MenuItem>
                            <MenuItem value="Same Day">Same Day</MenuItem>
                            <MenuItem value="Overnight">Overnight</MenuItem>
                            <MenuItem value="International">International</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {/* Bookings Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell><strong>AWB Number</strong></TableCell>
                            <TableCell><strong>Shipper</strong></TableCell>
                            <TableCell><strong>Consignee</strong></TableCell>
                            <TableCell><strong>Service Type</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Weight</strong></TableCell>
                            <TableCell><strong>Amount</strong></TableCell>
                            <TableCell><strong>Booking Date</strong></TableCell>
                            <TableCell align="center"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : bookings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    No bookings found
                                </TableCell>
                            </TableRow>
                        ) : (
                            bookings.map((booking) => (
                                <TableRow key={booking._id} hover>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="bold" color="primary">
                                            {booking.awbNumber}
                                        </Typography>
                                        {booking.referenceNumber && (
                                            <Typography variant="caption" color="text.secondary">
                                                Ref: {booking.referenceNumber}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {booking.shipper?.name || 'N/A'}
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                            {booking.shipper?.company || ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {booking.consignee?.name || booking.consigneeDetails?.name || 'N/A'}
                                        <br />
                                        <Typography variant="caption" color="text.secondary">
                                            {booking.consignee?.mobile || booking.consigneeDetails?.mobile || ''}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={booking.serviceType} size="small" variant="outlined" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={booking.status}
                                            color={statusColors[booking.status] || 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{booking.weight} {booking.weightUnit}</TableCell>
                                    <TableCell>${booking.totalAmount?.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {new Date(booking.bookingDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell align="center">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleViewDetails(booking._id)}
                                            title="View Details"
                                        >
                                            <ViewIcon />
                                        </IconButton>
                                        {hasPermission('booking', 'edit') && (
                                            <IconButton
                                                size="small"
                                                color="info"
                                                onClick={() => navigate(`/bookings/${booking._id}/edit`)}
                                                title="Edit"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        )}
                                        {hasPermission('booking', 'delete') && ['Booked', 'Cancelled'].includes(booking.status) && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDelete(booking._id)}
                                                title="Delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                        count={pagination.pages}
                        page={pagination.page}
                        onChange={(e, value) => setPagination({ ...pagination, page: value })}
                        color="primary"
                    />
                </Box>
            )}
        </Box>
    );
};

export default BookingManagement;

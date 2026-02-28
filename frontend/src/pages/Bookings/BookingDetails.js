import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Paper,
    Typography,
    Grid,
    Chip,
    Divider,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    StepContent
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    Print as PrintIcon,
    Edit as EditIcon,
    LocalShipping as ShippingIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { bookingAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BookingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusDialog, setStatusDialog] = useState(false);
    const [statusUpdate, setStatusUpdate] = useState({
        status: '',
        location: '',
        remarks: ''
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
        fetchBookingDetails();
    }, [id]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await bookingAPI.getById(id);
            setBooking(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        try {
            await bookingAPI.updateStatus(id, statusUpdate.status, statusUpdate.location, statusUpdate.remarks);
            toast.success('Status updated successfully');
            setStatusDialog(false);
            setStatusUpdate({ status: '', location: '', remarks: '' });
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleCancelBooking = async () => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await bookingAPI.cancel(id, 'Cancelled by user');
            toast.success('Booking cancelled successfully');
            fetchBookingDetails();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to cancel booking');
        }
    };

    const handlePrintLabel = () => {
        // Implement label printing logic
        window.print();
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Loading booking details...</Typography>
            </Box>
        );
    }

    if (!booking) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography>Booking not found</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton onClick={() => navigate('/bookings')} sx={{ mr: 2 }}>
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {booking.awbNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Booked on {new Date(booking.bookingDate).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<PrintIcon />}
                        onClick={handlePrintLabel}
                    >
                        Print Label
                    </Button>
                    {hasPermission('booking', 'edit') && !['Delivered', 'Cancelled'].includes(booking.status) && (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<ShippingIcon />}
                                onClick={() => setStatusDialog(true)}
                            >
                                Update Status
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<CancelIcon />}
                                onClick={handleCancelBooking}
                            >
                                Cancel
                            </Button>
                        </>
                    )}
                </Box>
            </Box>

            {/* Status Chip */}
            <Box sx={{ mb: 3 }}>
                <Chip
                    label={booking.status}
                    color={statusColors[booking.status] || 'default'}
                    size="large"
                    sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Shipper Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>Name:</strong></TableCell>
                                        <TableCell>{booking.shipper?.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Company:</strong></TableCell>
                                        <TableCell>{booking.shipper?.company}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Mobile:</strong></TableCell>
                                        <TableCell>{booking.shipper?.mobile}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Email:</strong></TableCell>
                                        <TableCell>{booking.shipper?.email}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Consignee Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>Name:</strong></TableCell>
                                        <TableCell>{booking.consignee?.name || booking.consigneeDetails?.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Mobile:</strong></TableCell>
                                        <TableCell>{booking.consignee?.mobile || booking.consigneeDetails?.mobile}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Email:</strong></TableCell>
                                        <TableCell>{booking.consignee?.email || booking.consigneeDetails?.email}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Address:</strong></TableCell>
                                        <TableCell>
                                            {booking.consignee?.address?.street || booking.consigneeDetails?.address?.street}, {' '}
                                            {booking.consignee?.address?.city || booking.consigneeDetails?.address?.city}, {' '}
                                            {booking.consignee?.address?.state || booking.consigneeDetails?.address?.state} {' '}
                                            {booking.consignee?.address?.postalCode || booking.consigneeDetails?.address?.postalCode}
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Shipment Details */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Shipment Details
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>Service Type:</strong></TableCell>
                                        <TableCell><Chip label={booking.serviceType} size="small" /></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Shipment Type:</strong></TableCell>
                                        <TableCell>{booking.shipmentType}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Destination:</strong></TableCell>
                                        <TableCell>{booking.destinationType}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Pieces:</strong></TableCell>
                                        <TableCell>{booking.numberOfPieces}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Weight:</strong></TableCell>
                                        <TableCell>{booking.weight} {booking.weightUnit}</TableCell>
                                    </TableRow>
                                    {booking.volumetricWeight && (
                                        <TableRow>
                                            <TableCell><strong>Volumetric Weight:</strong></TableCell>
                                            <TableCell>{booking.volumetricWeight.toFixed(2)} {booking.weightUnit}</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell><strong>Description:</strong></TableCell>
                                        <TableCell>{booking.description}</TableCell>
                                    </TableRow>
                                    {booking.referenceNumber && (
                                        <TableRow>
                                            <TableCell><strong>Reference:</strong></TableCell>
                                            <TableCell>{booking.referenceNumber}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Payment & Pricing */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Payment & Pricing
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Table size="small">
                                <TableBody>
                                    <TableRow>
                                        <TableCell><strong>Payment Mode:</strong></TableCell>
                                        <TableCell><Chip label={booking.paymentMode} size="small" color="primary" /></TableCell>
                                    </TableRow>
                                    {booking.paymentMode === 'COD' && (
                                        <TableRow>
                                            <TableCell><strong>COD Amount:</strong></TableCell>
                                            <TableCell>${booking.codAmount?.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell><strong>Shipping Charges:</strong></TableCell>
                                        <TableCell>${booking.shippingCharges?.toFixed(2)}</TableCell>
                                    </TableRow>
                                    {booking.insuranceCharges > 0 && (
                                        <TableRow>
                                            <TableCell><strong>Insurance:</strong></TableCell>
                                            <TableCell>${booking.insuranceCharges?.toFixed(2)}</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell><strong>Fuel Surcharge:</strong></TableCell>
                                        <TableCell>${booking.fuelSurcharge?.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>GST:</strong></TableCell>
                                        <TableCell>${booking.gstAmount?.toFixed(2)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell><strong>Total Amount:</strong></TableCell>
                                        <TableCell>
                                            <Typography variant="h6" color="primary">
                                                ${booking.totalAmount?.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status History Timeline */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tracking History
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {booking.statusHistory.map((history, index) => (
                                <Box key={index} sx={{ mb: 3, pl: 2, borderLeft: 3, borderColor: statusColors[history.status] || 'grey.500' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Chip
                                            icon={history.status === 'Delivered' ? <CheckIcon /> : <ShippingIcon />}
                                            label={history.status}
                                            color={statusColors[history.status] || 'default'}
                                            size="small"
                                            sx={{ mr: 2 }}
                                        />
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(history.timestamp).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2">{history.location}</Typography>
                                    {history.remarks && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                            {history.remarks}
                                        </Typography>
                                    )}
                                    {history.updatedBy && (
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                            Updated by: {history.updatedBy.name}
                                        </Typography>
                                    )}
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Update Status Dialog */}
            <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Update Booking Status</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            select
                            fullWidth
                            label="Status"
                            value={statusUpdate.status}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, status: e.target.value })}
                        >
                            <MenuItem value="Picked Up">Picked Up</MenuItem>
                            <MenuItem value="In Transit">In Transit</MenuItem>
                            <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                            <MenuItem value="Delivered">Delivered</MenuItem>
                            <MenuItem value="Returned">Returned</MenuItem>
                            <MenuItem value="On Hold">On Hold</MenuItem>
                            <MenuItem value="Failed Delivery">Failed Delivery</MenuItem>
                        </TextField>

                        <TextField
                            fullWidth
                            label="Location"
                            value={statusUpdate.location}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, location: e.target.value })}
                        />

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Remarks"
                            value={statusUpdate.remarks}
                            onChange={(e) => setStatusUpdate({ ...statusUpdate, remarks: e.target.value })}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleUpdateStatus}
                        variant="contained"
                        disabled={!statusUpdate.status}
                    >
                        Update Status
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default BookingDetails;

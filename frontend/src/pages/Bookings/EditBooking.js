import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Paper,
    Typography,
    Grid,
    MenuItem,
    CircularProgress
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const EditBooking = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);

    useEffect(() => {
        fetchBooking();
    }, [id]);

    const fetchBooking = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/bookings/${id}`);
            setBooking(response.data.data);
        } catch (error) {
            console.error('Error fetching booking:', error);
            toast.error('Failed to fetch booking details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/bookings/${id}`, booking);
            toast.success('Booking updated successfully');
            navigate(`/bookings/${id}`);
        } catch (error) {
            console.error('Error updating booking:', error);
            toast.error(error.response?.data?.message || 'Failed to update booking');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!booking) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography>Booking not found</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
                <Button
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/bookings')}
                    sx={{ mr: 2 }}
                >
                    Back
                </Button>
                <Typography variant="h4">Edit Booking - {booking.awbNumber}</Typography>
            </Box>

            <Paper sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>
                                Booking Information
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="AWB Number"
                                value={booking.awbNumber || ''}
                                disabled
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Reference Number"
                                value={booking.referenceNumber || ''}
                                onChange={(e) => setBooking({ ...booking, referenceNumber: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                label="Service Type"
                                value={booking.serviceType || ''}
                                onChange={(e) => setBooking({ ...booking, serviceType: e.target.value })}
                            >
                                <MenuItem value="Standard">Standard</MenuItem>
                                <MenuItem value="Express">Express</MenuItem>
                                <MenuItem value="Economy">Economy</MenuItem>
                                <MenuItem value="Same Day">Same Day</MenuItem>
                                <MenuItem value="International">International</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                label="Status"
                                value={booking.status || ''}
                                onChange={(e) => setBooking({ ...booking, status: e.target.value })}
                            >
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Picked Up">Picked Up</MenuItem>
                                <MenuItem value="In Transit">In Transit</MenuItem>
                                <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                                <MenuItem value="Delivered">Delivered</MenuItem>
                                <MenuItem value="Failed">Failed</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                                <MenuItem value="On Hold">On Hold</MenuItem>
                                <MenuItem value="Returned">Returned</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                label="Payment Mode"
                                value={booking.paymentMode || ''}
                                onChange={(e) => setBooking({ ...booking, paymentMode: e.target.value })}
                            >
                                <MenuItem value="Prepaid">Prepaid</MenuItem>
                                <MenuItem value="COD">COD</MenuItem>
                                <MenuItem value="To Pay">To Pay</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Weight (kg)"
                                value={booking.weight || ''}
                                onChange={(e) => setBooking({ ...booking, weight: parseFloat(e.target.value) })}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="No. of Pieces"
                                value={booking.numberOfPieces || ''}
                                onChange={(e) => setBooking({ ...booking, numberOfPieces: parseInt(e.target.value) })}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Description"
                                value={booking.description || ''}
                                onChange={(e) => setBooking({ ...booking, description: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Declared Value"
                                value={booking.declaredValue || ''}
                                onChange={(e) => setBooking({ ...booking, declaredValue: parseFloat(e.target.value) })}
                            />
                        </Grid>

                        {booking.paymentMode === 'COD' && (
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="COD Amount"
                                    value={booking.codAmount || ''}
                                    onChange={(e) => setBooking({ ...booking, codAmount: parseFloat(e.target.value) })}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                                Consignee Details
                            </Typography>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Consignee Name"
                                value={booking.consigneeDetails?.name || ''}
                                onChange={(e) => setBooking({
                                    ...booking,
                                    consigneeDetails: { ...booking.consigneeDetails, name: e.target.value }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Consignee Mobile"
                                value={booking.consigneeDetails?.mobile || ''}
                                onChange={(e) => setBooking({
                                    ...booking,
                                    consigneeDetails: { ...booking.consigneeDetails, mobile: e.target.value }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Delivery Address"
                                multiline
                                rows={3}
                                value={booking.consigneeDetails?.address?.street || ''}
                                onChange={(e) => setBooking({
                                    ...booking,
                                    consigneeDetails: {
                                        ...booking.consigneeDetails,
                                        address: { ...booking.consigneeDetails?.address, street: e.target.value }
                                    }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="City"
                                value={booking.consigneeDetails?.address?.city || ''}
                                onChange={(e) => setBooking({
                                    ...booking,
                                    consigneeDetails: {
                                        ...booking.consigneeDetails,
                                        address: { ...booking.consigneeDetails?.address, city: e.target.value }
                                    }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Postal Code"
                                value={booking.consigneeDetails?.address?.postalCode || ''}
                                onChange={(e) => setBooking({
                                    ...booking,
                                    consigneeDetails: {
                                        ...booking.consigneeDetails,
                                        address: { ...booking.consigneeDetails?.address, postalCode: e.target.value }
                                    }
                                })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box display="flex" gap={2}>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<SaveIcon />}
                                >
                                    Update Booking
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/bookings')}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </Box>
    );
};

export default EditBooking;

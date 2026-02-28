import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Grid,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Divider
} from '@mui/material';
import { Delete as DeleteIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const { formatCurrency, currencySymbol } = useSettings();
    const [shippers, setShippers] = useState([]);
    const [selectedShipper, setSelectedShipper] = useState(null);
    const [selectedBookings, setSelectedBookings] = useState([]);
    const [availableBookings, setAvailableBookings] = useState([]);
    const [form, setForm] = useState({
        periodFrom: '',
        periodTo: '',
        dueDate: '',
        discount: 0,
        discountPercentage: 0,
        notes: '',
        termsAndConditions: 'Payment due within 30 days. Late payments subject to interest charges.'
    });
    const [totals, setTotals] = useState({
        subtotal: 0,
        discount: 0,
        taxAmount: 0,
        total: 0
    });

    useEffect(() => {
        fetchShippers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedShipper && form.periodFrom && form.periodTo) {
            fetchBookings();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedShipper, form.periodFrom, form.periodTo]);

    const calculateTotals = useCallback(() => {
        const subtotal = selectedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const discountAmount = form.discountPercentage
            ? (subtotal * form.discountPercentage) / 100
            : form.discount;
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = (afterDiscount * 18) / 100; // 18% GST
        const total = afterDiscount + taxAmount;

        setTotals({
            subtotal,
            discount: discountAmount,
            taxAmount,
            total
        });
    }, [selectedBookings, form.discount, form.discountPercentage]);

    useEffect(() => {
        calculateTotals();
    }, [calculateTotals]);

    const fetchShippers = async () => {
        try {
            console.log('Fetching shippers...');
            const response = await api.get('/shippers?status=Active&limit=1000');
            console.log('Shippers response:', response.data);
            const shippersList = response.data.data || [];
            console.log('Shippers list:', shippersList);
            setShippers(shippersList);
        } catch (error) {
            console.error('Error fetching shippers:', error);
            toast.error('Failed to fetch shippers');
            setShippers([]);
        }
    };

    const fetchBookings = async () => {
        try {
            console.log('Fetching bookings with params:', {
                shipperId: selectedShipper._id,
                status: 'Delivered',
                startDate: form.periodFrom,
                endDate: form.periodTo
            });
            const response = await api.get('/bookings', {
                params: {
                    shipperId: selectedShipper._id,
                    status: 'Delivered',
                    startDate: form.periodFrom,
                    endDate: form.periodTo,
                    limit: 1000
                }
            });
            console.log('Bookings response:', response.data);
            // Filter out bookings that already have an invoice
            const bookings = response.data.data || [];
            console.log('Total bookings:', bookings.length);
            const unbilledBookings = bookings.filter(b => !b.invoiceGenerated);
            console.log('Unbilled bookings:', unbilledBookings.length);
            setAvailableBookings(unbilledBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to fetch bookings');
            setAvailableBookings([]);
        }
    };

    const handleAddBooking = (booking) => {
        if (!selectedBookings.find(b => b._id === booking._id)) {
            setSelectedBookings([...selectedBookings, booking]);
        }
    };

    const handleRemoveBooking = (bookingId) => {
        setSelectedBookings(selectedBookings.filter(b => b._id !== bookingId));
    };

    const handleSubmit = async () => {
        try {
            if (!selectedShipper) {
                toast.error('Please select a shipper');
                return;
            }

            if (selectedBookings.length === 0) {
                toast.error('Please select at least one booking');
                return;
            }

            if (!form.periodFrom || !form.periodTo) {
                toast.error('Please select billing period');
                return;
            }

            const invoiceData = {
                shipper: selectedShipper._id,
                bookings: selectedBookings.map(b => b._id),
                periodFrom: form.periodFrom,
                periodTo: form.periodTo,
                dueDate: form.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                discount: form.discount,
                discountPercentage: form.discountPercentage,
                notes: form.notes,
                termsAndConditions: form.termsAndConditions
            };

            const response = await api.post('/invoices', invoiceData);
            toast.success('Invoice created successfully');
            navigate(`/invoices/${response.data._id}`);
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error(error.response?.data?.message || 'Failed to create invoice');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={() => navigate('/invoices')}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    Create Invoice
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Form Section */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Invoice Details
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={shippers}
                                        getOptionLabel={(option) => `${option.company} - ${option.name}`}
                                        value={selectedShipper}
                                        onChange={(e, newValue) => setSelectedShipper(newValue)}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Select Shipper *" fullWidth />
                                        )}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Period From *"
                                        value={form.periodFrom}
                                        onChange={(e) => setForm({ ...form, periodFrom: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Period To *"
                                        value={form.periodTo}
                                        onChange={(e) => setForm({ ...form, periodTo: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="date"
                                        label="Due Date"
                                        value={form.dueDate}
                                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                        helperText="Default: 30 days from invoice date"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6" gutterBottom>
                                        Available Bookings
                                    </Typography>
                                    <Autocomplete
                                        options={availableBookings}
                                        getOptionLabel={(option) =>
                                            `${option.awbNumber || 'N/A'} - ${option.serviceType || 'N/A'} - ${formatCurrency(option.totalAmount || 0)}`
                                        }
                                        onChange={(e, newValue) => {
                                            if (newValue) handleAddBooking(newValue);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Add Booking"
                                                fullWidth
                                                helperText={`${availableBookings.length} booking(s) available`}
                                            />
                                        )}
                                        noOptionsText="No bookings available for selected period"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Selected Bookings ({selectedBookings.length})
                                    </Typography>
                                    <TableContainer component={Paper} elevation={0}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>AWB</TableCell>
                                                    <TableCell>Service</TableCell>
                                                    <TableCell>Weight</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                    <TableCell align="center">Action</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedBookings.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={5} align="center">
                                                            No bookings selected
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    selectedBookings.map((booking) => (
                                                        <TableRow key={booking._id}>
                                                            <TableCell>{booking.awbNumber}</TableCell>
                                                            <TableCell>{booking.serviceType}</TableCell>
                                                            <TableCell>{booking.weight} kg</TableCell>
                                                            <TableCell align="right">
                                                                {formatCurrency(booking.totalAmount)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => handleRemoveBooking(booking._id)}
                                                                >
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Discount Amount"
                                        value={form.discount}
                                        onChange={(e) =>
                                            setForm({ ...form, discount: parseFloat(e.target.value) || 0, discountPercentage: 0 })
                                        }
                                        InputProps={{ startAdornment: currencySymbol }}
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Discount Percentage"
                                        value={form.discountPercentage}
                                        onChange={(e) =>
                                            setForm({ ...form, discountPercentage: parseFloat(e.target.value) || 0, discount: 0 })
                                        }
                                        InputProps={{ endAdornment: '%' }}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Notes"
                                        value={form.notes}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Terms & Conditions"
                                        value={form.termsAndConditions}
                                        onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Summary Section */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ position: 'sticky', top: 20 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Invoice Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Subtotal:</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(totals.subtotal)}
                                    </Typography>
                                </Box>

                                {totals.discount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="error">
                                            Discount:
                                        </Typography>
                                        <Typography variant="body2" color="error">
                                            -{formatCurrency(totals.discount)}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Tax (GST 18%):</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(totals.taxAmount)}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        Total:
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold" color="primary">
                                        {formatCurrency(totals.total)}
                                    </Typography>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                <Typography variant="caption" color="text.secondary">
                                    {selectedBookings.length} booking(s) selected
                                </Typography>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    onClick={handleSubmit}
                                    disabled={selectedBookings.length === 0}
                                    sx={{ mt: 2 }}
                                >
                                    Create Invoice
                                </Button>

                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => navigate('/invoices')}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default CreateInvoice;

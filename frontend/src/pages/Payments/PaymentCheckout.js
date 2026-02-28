import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    FormLabel,
    Alert,
    Divider,
    CircularProgress,
    Paper
} from '@mui/material';
import {
    Payment as PaymentIcon,
    ArrowBack as BackIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const PaymentCheckout = () => {
    const navigate = useNavigate();
    const { invoiceId } = useParams();
    const { formatCurrency } = useSettings();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('PayPal');

    useEffect(() => {
        fetchInvoice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/invoices/${invoiceId}`);
            setInvoice(response.data);
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Failed to fetch invoice details');
            navigate('/invoices');
        } finally {
            setLoading(false);
        }
    };

    const handlePayPalPayment = async () => {
        try {
            setProcessing(true);

            const response = await api.post('/payments/paypal/create', {
                invoiceId: invoice._id,
                amount: invoice.balanceAmount,
                currency: 'USD',
                description: `Payment for Invoice ${invoice.invoiceNumber}`
            });

            if (response.data.approvalUrl) {
                // Redirect to PayPal for approval
                window.location.href = response.data.approvalUrl;
            }
        } catch (error) {
            console.error('Error creating PayPal payment:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate PayPal payment');
            setProcessing(false);
        }
    };

    const handleSkrillPayment = async () => {
        try {
            setProcessing(true);

            const response = await api.post('/payments/skrill/create', {
                invoiceId: invoice._id,
                amount: invoice.balanceAmount,
                currency: 'USD',
                description: `Payment for Invoice ${invoice.invoiceNumber}`
            });

            if (response.data.skrillData && response.data.skrillUrl) {
                // Create a form and submit to Skrill
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = response.data.skrillUrl;

                Object.keys(response.data.skrillData).forEach(key => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = response.data.skrillData[key];
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
            }
        } catch (error) {
            console.error('Error creating Skrill payment:', error);
            toast.error(error.response?.data?.message || 'Failed to initiate Skrill payment');
            setProcessing(false);
        }
    };

    const handlePayment = () => {
        if (paymentMethod === 'PayPal') {
            handlePayPalPayment();
        } else if (paymentMethod === 'Skrill') {
            handleSkrillPayment();
        }
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!invoice) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Invoice not found</Alert>
            </Box>
        );
    }

    if (invoice.balanceAmount <= 0) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="info">This invoice has been fully paid</Alert>
                <Button sx={{ mt: 2 }} onClick={() => navigate(`/invoices/${invoice._id}`)}>
                    View Invoice
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button startIcon={<BackIcon />} onClick={() => navigate(`/invoices/${invoice._id}`)}>
                    Back
                </Button>
                <Typography variant="h4" fontWeight="bold">
                    Payment Checkout
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Invoice Summary */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Invoice Summary
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Invoice Number:
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {invoice.invoiceNumber}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Invoice Date:
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(invoice.invoiceDate).toLocaleDateString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Due Date:
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(invoice.dueDate).toLocaleDateString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Shipper:
                                    </Typography>
                                    <Typography variant="body1">
                                        {invoice.shipper.companyName}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2">Total Amount:</Typography>
                                <Typography variant="body2">
                                    {formatCurrency(invoice.totalAmount)}
                                </Typography>
                            </Box>

                            {invoice.paidAmount > 0 && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="success.main">
                                        Paid Amount:
                                    </Typography>
                                    <Typography variant="body2" color="success.main">
                                        {formatCurrency(invoice.paidAmount)}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Amount to Pay:
                                </Typography>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                    {formatCurrency(invoice.balanceAmount)}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Payment Method Selection */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <FormControl component="fieldset" fullWidth>
                                <FormLabel component="legend">
                                    <Typography variant="h6" gutterBottom>
                                        Select Payment Method
                                    </Typography>
                                </FormLabel>
                                <RadioGroup
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                >
                                    <Paper sx={{ p: 2, mb: 2, border: paymentMethod === 'PayPal' ? '2px solid' : '1px solid', borderColor: paymentMethod === 'PayPal' ? 'primary.main' : 'divider' }}>
                                        <FormControlLabel
                                            value="PayPal"
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <img
                                                        src="https://www.paypalobjects.com/webstatic/mktg/logo/AM_mc_vs_dc_ae.jpg"
                                                        alt="PayPal"
                                                        style={{ height: 40 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            PayPal
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Pay securely with your PayPal account or credit card
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </Paper>

                                    <Paper sx={{ p: 2, border: paymentMethod === 'Skrill' ? '2px solid' : '1px solid', borderColor: paymentMethod === 'Skrill' ? 'primary.main' : 'divider' }}>
                                        <FormControlLabel
                                            value="Skrill"
                                            control={<Radio />}
                                            label={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <img
                                                        src="https://www.skrill.com/typo3conf/ext/theme/Resources/Public/Images/skrill-logo.svg"
                                                        alt="Skrill"
                                                        style={{ height: 40 }}
                                                    />
                                                    <Box>
                                                        <Typography variant="body1" fontWeight="bold">
                                                            Skrill
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Pay with your Skrill wallet or credit card
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            }
                                        />
                                    </Paper>
                                </RadioGroup>
                            </FormControl>

                            <Alert severity="info" sx={{ mt: 3 }}>
                                <Typography variant="body2">
                                    You will be redirected to {paymentMethod} to complete your payment securely.
                                    After successful payment, your invoice will be automatically updated.
                                </Typography>
                            </Alert>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Payment Button */}
                <Grid item xs={12}>
                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                        onClick={handlePayment}
                        disabled={processing}
                        sx={{ py: 2 }}
                    >
                        {processing ? 'Processing...' : `Pay ${formatCurrency(invoice.balanceAmount)} with ${paymentMethod}`}
                    </Button>
                </Grid>

                {/* Security Notice */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="caption" color="text.secondary">
                            🔒 Your payment is secured by {paymentMethod}. We do not store your card details.
                            All transactions are encrypted and secure.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default PaymentCheckout;

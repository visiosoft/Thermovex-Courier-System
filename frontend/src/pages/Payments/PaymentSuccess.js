import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Divider,
    Button,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Error as ErrorIcon
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const PaymentSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [payment, setPayment] = useState(null);
    const [error, setError] = useState(null);

    const gateway = searchParams.get('gateway') || 'paypal';
    const orderId = searchParams.get('token') || searchParams.get('orderId');
    const payerId = searchParams.get('PayerID');

    useEffect(() => {
        if (gateway === 'paypal' && orderId) {
            capturePayPalPayment();
        } else if (gateway === 'skrill') {
            // Skrill processes via webhook, just show success message
            setLoading(false);
        } else {
            setError('Invalid payment parameters');
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gateway, orderId, payerId]);

    const capturePayPalPayment = async () => {
        try {
            setLoading(true);
            const response = await api.post(`/payments/paypal/capture/${orderId}`);
            setPayment(response.data.payment);
            toast.success('Payment completed successfully!');
        } catch (error) {
            console.error('Error capturing payment:', error);
            setError(error.response?.data?.message || 'Failed to process payment');
            toast.error('Payment processing failed');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Completed: 'success',
            Processing: 'info',
            Failed: 'error'
        };
        return colors[status] || 'default';
    };

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress size={60} />
                <Typography variant="h6" sx={{ mt: 3 }}>
                    Processing your payment...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Please wait while we confirm your transaction
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 5 }}>
                        <ErrorIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            Payment Failed
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            {error}
                        </Typography>
                        <Button variant="contained" onClick={() => navigate('/invoices')}>
                            Back to Invoices
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 5 }}>
            <Card>
                <CardContent sx={{ textAlign: 'center', py: 5 }}>
                    <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Payment Successful!
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        Thank you for your payment. Your transaction has been completed successfully.
                    </Typography>

                    {payment && (
                        <>
                            <Divider sx={{ my: 3 }} />

                            <Grid container spacing={2} sx={{ textAlign: 'left' }}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Transaction ID
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {payment.transactionId}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Payment Gateway
                                    </Typography>
                                    <Typography variant="body1">
                                        <Chip label={payment.gateway} color="primary" size="small" />
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Amount Paid
                                    </Typography>
                                    <Typography variant="h6" color="success.main">
                                        ${payment.amount.toLocaleString()} {payment.currency}
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Status
                                    </Typography>
                                    <Typography variant="body1">
                                        <Chip
                                            label={payment.status}
                                            color={getStatusColor(payment.status)}
                                            size="small"
                                        />
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Payment Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(payment.completedAt || payment.createdAt).toLocaleString()}
                                    </Typography>
                                </Grid>

                                {payment.gatewayTransactionId && (
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="caption" color="text.secondary">
                                            Gateway Reference
                                        </Typography>
                                        <Typography variant="body2">
                                            {payment.gatewayTransactionId}
                                        </Typography>
                                    </Grid>
                                )}
                            </Grid>

                            <Divider sx={{ my: 3 }} />

                            <Alert severity="success" sx={{ mb: 3 }}>
                                A confirmation email has been sent to your registered email address.
                            </Alert>
                        </>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                        {payment?.invoice && (
                            <Button
                                variant="contained"
                                onClick={() => navigate(`/invoices/${payment.invoice}`)}
                            >
                                View Invoice
                            </Button>
                        )}
                        <Button
                            variant="outlined"
                            onClick={() => navigate('/payments')}
                        >
                            View All Payments
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PaymentSuccess;

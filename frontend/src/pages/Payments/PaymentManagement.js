import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    TextField,
    Grid,
    MenuItem,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Visibility as ViewIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Refresh as RefreshIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const PaymentManagement = () => {
    const navigate = useNavigate();
    const { currencySymbol } = useSettings();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [gatewayFilter, setGatewayFilter] = useState('');
    const [stats, setStats] = useState(null);
    const [refundDialog, setRefundDialog] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [refundForm, setRefundForm] = useState({
        amount: '',
        reason: ''
    });

    useEffect(() => {
        fetchPayments();
        fetchStats();
    }, [statusFilter, gatewayFilter]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (gatewayFilter) params.gateway = gatewayFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await api.get('/payments', { params });
            setPayments(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to fetch payments');
            setPayments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/payments/stats/summary');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleRefund = async () => {
        try {
            if (!refundForm.amount || refundForm.amount <= 0) {
                toast.error('Please enter a valid refund amount');
                return;
            }

            await api.post(`/payments/${selectedPayment._id}/refund`, refundForm);
            toast.success('Payment refunded successfully');
            setRefundDialog(false);
            setRefundForm({ amount: '', reason: '' });
            fetchPayments();
            fetchStats();
        } catch (error) {
            console.error('Error refunding payment:', error);
            toast.error(error.response?.data?.message || 'Failed to refund payment');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Pending: 'warning',
            Processing: 'info',
            Completed: 'success',
            Failed: 'error',
            Cancelled: 'default',
            Refunded: 'secondary'
        };
        return colors[status] || 'default';
    };

    const getGatewayColor = (gateway) => {
        const colors = {
            PayPal: 'primary',
            Skrill: 'secondary',
            Manual: 'default',
            Cash: 'success',
            Cheque: 'info',
            'Bank Transfer': 'warning'
        };
        return colors[gateway] || 'default';
    };

    const filteredPayments = payments.filter(payment =>
        payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.gatewayTransactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.shipper?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                    Payment Management
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => {
                        fetchPayments();
                        fetchStats();
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Payments
                                </Typography>
                                <Typography variant="h4">{stats.totalPayments}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Completed
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {stats.completedPayments}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#fff3e0' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Pending
                                </Typography>
                                <Typography variant="h4" color="warning.main">
                                    {stats.pendingPayments}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#e3f2fd' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Revenue
                                </Typography>
                                <Typography variant="h4" color="primary">
                                    ${stats.totalRevenue.toLocaleString()}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Revenue by Gateway */}
            {stats?.revenueByGateway && stats.revenueByGateway.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Revenue by Payment Gateway
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            {stats.revenueByGateway.map((gateway) => (
                                <Grid item xs={12} sm={6} md={3} key={gateway._id}>
                                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                                        <Chip label={gateway._id} color={getGatewayColor(gateway._id)} sx={{ mb: 1 }} />
                                        <Typography variant="h6" color="primary">
                                            ${gateway.total.toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {gateway.count} transactions
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search by transaction ID or shipper..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Status"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All Status</MenuItem>
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="Processing">Processing</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                                <MenuItem value="Failed">Failed</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                                <MenuItem value="Refunded">Refunded</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Gateway"
                                value={gatewayFilter}
                                onChange={(e) => setGatewayFilter(e.target.value)}
                            >
                                <MenuItem value="">All Gateways</MenuItem>
                                <MenuItem value="PayPal">PayPal</MenuItem>
                                <MenuItem value="Skrill">Skrill</MenuItem>
                                <MenuItem value="Manual">Manual</MenuItem>
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Cheque">Cheque</MenuItem>
                                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={fetchPayments}
                            >
                                Apply
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
                <CardContent>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Transaction ID</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Shipper</strong></TableCell>
                                    <TableCell><strong>Gateway</strong></TableCell>
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Gateway Ref</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            No payments found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment._id} hover>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="medium">
                                                    {payment.transactionId}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {new Date(payment.createdAt).toLocaleDateString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {new Date(payment.createdAt).toLocaleTimeString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{payment.shipper?.companyName}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={payment.gateway}
                                                    color={getGatewayColor(payment.gateway)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" fontWeight="bold">
                                                    ${payment.amount.toLocaleString()}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {payment.currency}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={payment.status}
                                                    color={getStatusColor(payment.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption">
                                                    {payment.gatewayTransactionId || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        color="primary"
                                                        onClick={() => navigate(`/payments/${payment._id}`)}
                                                    >
                                                        <ViewIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {payment.status === 'Completed' && !payment.isRefunded && (
                                                    <Tooltip title="Refund">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                                setSelectedPayment(payment);
                                                                setRefundForm({ amount: payment.amount, reason: '' });
                                                                setRefundDialog(true);
                                                            }}
                                                        >
                                                            <PaymentIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Refund Dialog */}
            <Dialog open={refundDialog} onClose={() => setRefundDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Refund Payment</DialogTitle>
                <DialogContent>
                    {selectedPayment && (
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="warning" sx={{ mb: 3 }}>
                                You are about to refund {selectedPayment.transactionId}
                            </Alert>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        label="Refund Amount *"
                                        value={refundForm.amount}
                                        onChange={(e) => setRefundForm({ ...refundForm, amount: parseFloat(e.target.value) })}
                                        InputProps={{ startAdornment: currencySymbol }}
                                        helperText={`Maximum: ${currencySymbol}${selectedPayment.amount}`}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        label="Reason *"
                                        value={refundForm.reason}
                                        onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRefundDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleRefund}
                        variant="contained"
                        color="error"
                        disabled={!refundForm.amount || !refundForm.reason}
                    >
                        Process Refund
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PaymentManagement;

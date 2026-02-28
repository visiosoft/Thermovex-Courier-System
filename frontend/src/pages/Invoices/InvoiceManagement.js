import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    MenuItem,
    InputAdornment,
    Tooltip,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Visibility as ViewIcon,
    GetApp as DownloadIcon,
    Payment as PaymentIcon,
    AutoMode as AutoIcon,
    Search as SearchIcon,
    FilterList as FilterIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const InvoiceManagement = () => {
    const navigate = useNavigate();
    const { formatCurrency } = useSettings();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [autoGenDialog, setAutoGenDialog] = useState(false);
    const [autoGenForm, setAutoGenForm] = useState({
        periodFrom: '',
        periodTo: '',
        shipperId: ''
    });
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchInvoices();
        fetchStats();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, paymentStatusFilter]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const params = {};
            if (statusFilter) params.status = statusFilter;
            if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await api.get('/invoices', { params });
            setInvoices(response.data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to fetch invoices');
            setInvoices([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await api.get('/invoices/stats/summary');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleAutoGenerate = async () => {
        try {
            if (!autoGenForm.periodFrom || !autoGenForm.periodTo) {
                toast.error('Please select period dates');
                return;
            }

            const response = await api.post('/invoices/auto-generate', autoGenForm);
            toast.success(response.data.message);
            setAutoGenDialog(false);
            setAutoGenForm({ periodFrom: '', periodTo: '', shipperId: '' });
            fetchInvoices();
            fetchStats();
        } catch (error) {
            console.error('Error auto-generating invoices:', error);
            toast.error(error.response?.data?.message || 'Failed to generate invoices');
        }
    };

    const handleDownloadPDF = async (invoiceId, invoiceNumber) => {
        try {
            const response = await api.get(`/invoices/${invoiceId}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Invoice PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            Draft: 'default',
            Sent: 'info',
            Viewed: 'warning',
            Paid: 'success',
            Overdue: 'error',
            Cancelled: 'default'
        };
        return colors[status] || 'default';
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            Unpaid: 'warning',
            'Partially Paid': 'info',
            Paid: 'success',
            Overdue: 'error',
            Cancelled: 'default'
        };
        return colors[status] || 'default';
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.shipper?.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                    Invoice Management
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<AutoIcon />}
                        onClick={() => setAutoGenDialog(true)}
                    >
                        Auto Generate
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/invoices/create')}
                    >
                        Create Invoice
                    </Button>
                </Box>
            </Box>

            {/* Stats Cards */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={3}>
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Invoices
                                </Typography>
                                <Typography variant="h4">{stats.totalInvoices}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#e8f5e9' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Total Revenue
                                </Typography>
                                <Typography variant="h4" color="success.main">
                                    {formatCurrency(stats.totalRevenue)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#fff3e0' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Outstanding
                                </Typography>
                                <Typography variant="h4" color="warning.main">
                                    {formatCurrency(stats.totalOutstanding)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <Card sx={{ bgcolor: '#ffebee' }}>
                            <CardContent>
                                <Typography color="text.secondary" gutterBottom>
                                    Overdue
                                </Typography>
                                <Typography variant="h4" color="error.main">
                                    {stats.overdueInvoices}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Filters */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                placeholder="Search by invoice number or shipper..."
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
                                <MenuItem value="Draft">Draft</MenuItem>
                                <MenuItem value="Sent">Sent</MenuItem>
                                <MenuItem value="Viewed">Viewed</MenuItem>
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Overdue">Overdue</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                select
                                fullWidth
                                label="Payment Status"
                                value={paymentStatusFilter}
                                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            >
                                <MenuItem value="">All Payment Status</MenuItem>
                                <MenuItem value="Unpaid">Unpaid</MenuItem>
                                <MenuItem value="Partially Paid">Partially Paid</MenuItem>
                                <MenuItem value="Paid">Paid</MenuItem>
                                <MenuItem value="Overdue">Overdue</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                startIcon={<FilterIcon />}
                                onClick={fetchInvoices}
                            >
                                Apply Filters
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
                <CardContent>
                    <TableContainer component={Paper} elevation={0}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>Invoice #</strong></TableCell>
                                    <TableCell><strong>Shipper</strong></TableCell>
                                    <TableCell><strong>Date</strong></TableCell>
                                    <TableCell><strong>Due Date</strong></TableCell>
                                    <TableCell align="right"><strong>Amount</strong></TableCell>
                                    <TableCell align="right"><strong>Paid</strong></TableCell>
                                    <TableCell align="right"><strong>Balance</strong></TableCell>
                                    <TableCell><strong>Status</strong></TableCell>
                                    <TableCell><strong>Payment</strong></TableCell>
                                    <TableCell align="center"><strong>Actions</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredInvoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={10} align="center">
                                            No invoices found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInvoices.map((invoice) => (
                                        <TableRow key={invoice._id} hover>
                                            <TableCell>{invoice.invoiceNumber}</TableCell>
                                            <TableCell>{invoice.shipper?.companyName}</TableCell>
                                            <TableCell>
                                                {new Date(invoice.invoiceDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(invoice.totalAmount)}
                                            </TableCell>
                                            <TableCell align="right">
                                                {formatCurrency(invoice.paidAmount)}
                                            </TableCell>
                                            <TableCell align="right">
                                                <strong>{formatCurrency(invoice.balanceAmount)}</strong>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={invoice.status}
                                                    color={getStatusColor(invoice.status)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={invoice.paymentStatus}
                                                    color={getPaymentStatusColor(invoice.paymentStatus)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Tooltip title="View Details">
                                                        <IconButton
                                                            size="small"
                                                            color="primary"
                                                            onClick={() => navigate(`/invoices/${invoice._id}`)}
                                                        >
                                                            <ViewIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Download PDF">
                                                        <IconButton
                                                            size="small"
                                                            color="info"
                                                            onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}
                                                        >
                                                            <DownloadIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {invoice.balanceAmount > 0 && (
                                                        <Tooltip title="Add Payment">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => navigate(`/invoices/${invoice._id}/payment`)}
                                                            >
                                                                <PaymentIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Auto Generate Dialog */}
            <Dialog open={autoGenDialog} onClose={() => setAutoGenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Auto-Generate Invoices</DialogTitle>
                <DialogContent>
                    <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
                        This will automatically generate invoices for all delivered bookings in the selected period.
                    </Alert>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Period From"
                                value={autoGenForm.periodFrom}
                                onChange={(e) => setAutoGenForm({ ...autoGenForm, periodFrom: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Period To"
                                value={autoGenForm.periodTo}
                                onChange={(e) => setAutoGenForm({ ...autoGenForm, periodTo: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                                Leave shipper empty to generate for all shippers
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAutoGenDialog(false)}>Cancel</Button>
                    <Button
                        onClick={handleAutoGenerate}
                        variant="contained"
                        disabled={!autoGenForm.periodFrom || !autoGenForm.periodTo}
                    >
                        Generate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InvoiceManagement;

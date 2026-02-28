import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    GetApp as DownloadIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const InvoiceDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { formatCurrency, currencySymbol } = useSettings();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [paymentDialog, setPaymentDialog] = useState(false);
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Cash',
        reference: '',
        remarks: ''
    });

    useEffect(() => {
        fetchInvoice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/invoices/${id}`);
            setInvoice(response.data);
            setPaymentForm({
                ...paymentForm,
                amount: response.data.balanceAmount
            });
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Failed to fetch invoice details');
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/invoices/${id}/pdf`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `invoice-${invoice.invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Invoice PDF downloaded successfully');
        } catch (error) {
            console.error('Error downloading PDF:', error);
            toast.error('Failed to download PDF');
        }
    };

    const handleAddPayment = async () => {
        try {
            if (!paymentForm.amount || paymentForm.amount <= 0) {
                toast.error('Please enter a valid payment amount');
                return;
            }

            if (paymentForm.amount > invoice.balanceAmount) {
                toast.error(`Payment amount cannot exceed balance of ${formatCurrency(invoice.balanceAmount)}`);
                return;
            }

            await api.post(`/invoices/${id}/payment`, paymentForm);
            toast.success('Payment added successfully');
            setPaymentDialog(false);
            fetchInvoice();
        } catch (error) {
            console.error('Error adding payment:', error);
            toast.error(error.response?.data?.message || 'Failed to add payment');
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

    if (loading) {
        return (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
                <Typography>Loading invoice...</Typography>
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

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/invoices')}>
                        <BackIcon />
                    </IconButton>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            {invoice.invoiceNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            <Chip label={invoice.status} color={getStatusColor(invoice.status)} size="small" />
                            <Chip
                                label={invoice.paymentStatus}
                                color={getPaymentStatusColor(invoice.paymentStatus)}
                                size="small"
                            />
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    {invoice.balanceAmount > 0 && (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<PaymentIcon />}
                                onClick={() => navigate(`/payments/checkout/${invoice._id}`)}
                            >
                                Pay Online
                            </Button>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<PaymentIcon />}
                                onClick={() => setPaymentDialog(true)}
                            >
                                Add Manual Payment
                            </Button>
                        </>
                    )}
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadPDF}
                    >
                        Download PDF
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3}>
                {/* Invoice Information */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="overline" color="text.secondary">
                                        Bill To
                                    </Typography>
                                    <Typography variant="h6">{invoice.customerDetails?.companyName || 'N/A'}</Typography>
                                    <Typography variant="body2">{invoice.customerDetails?.contactPerson || ''}</Typography>
                                    {invoice.customerDetails?.address && (
                                        <>
                                            <Typography variant="body2">{invoice.customerDetails.address.street || ''}</Typography>
                                            <Typography variant="body2">
                                                {[
                                                    invoice.customerDetails.address.city,
                                                    invoice.customerDetails.address.state,
                                                    invoice.customerDetails.address.pincode
                                                ].filter(Boolean).join(', ')}
                                            </Typography>
                                        </>
                                    )}
                                    <Typography variant="body2">Phone: {invoice.customerDetails?.mobile || 'N/A'}</Typography>
                                    <Typography variant="body2">Email: {invoice.customerDetails?.email || 'N/A'}</Typography>
                                    {invoice.customerDetails?.gstNumber && (
                                        <Typography variant="body2">GST: {invoice.customerDetails.gstNumber}</Typography>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Invoice Date
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(invoice.invoiceDate).toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary">
                                                Due Date
                                            </Typography>
                                            <Typography variant="body2">
                                                {new Date(invoice.dueDate).toLocaleDateString()}
                                            </Typography>
                                        </Grid>
                                        {invoice.periodFrom && invoice.periodTo && (
                                            <Grid item xs={12}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Billing Period
                                                </Typography>
                                                <Typography variant="body2">
                                                    {new Date(invoice.periodFrom).toLocaleDateString()} -{' '}
                                                    {new Date(invoice.periodTo).toLocaleDateString()}
                                                </Typography>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Line Items */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Invoice Items
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Description</TableCell>
                                            <TableCell>SAC Code</TableCell>
                                            <TableCell>Quantity</TableCell>
                                            <TableCell align="right">Rate</TableCell>
                                            <TableCell align="right">Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(invoice.items || []).map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell>{item.sacCode || '-'}</TableCell>
                                                <TableCell>{item.quantity} {item.unit || 'service'}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.rate || 0)}</TableCell>
                                                <TableCell align="right">{formatCurrency(item.amount || 0)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    {invoice.paymentRecords && invoice.paymentRecords.length > 0 && (
                        <Card>
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Payment History
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Amount</TableCell>
                                                <TableCell>Method</TableCell>
                                                <TableCell>Reference</TableCell>
                                                <TableCell>Remarks</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {invoice.paymentRecords.map((payment, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {new Date(payment.paymentDate).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>{formatCurrency(payment.amount || 0)}</TableCell>
                                                    <TableCell>{payment.paymentMode || '-'}</TableCell>
                                                    <TableCell>{payment.reference || '-'}</TableCell>
                                                    <TableCell>{payment.remarks || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Summary Sidebar */}
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
                                        {formatCurrency(invoice.subtotal || 0)}
                                    </Typography>
                                </Box>

                                {invoice.discount > 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="body2" color="error">
                                            Discount:
                                        </Typography>
                                        <Typography variant="body2" color="error">
                                            -{formatCurrency(invoice.discount || 0)}
                                        </Typography>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Taxable Amount:</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(invoice.taxableAmount || 0)}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2">Tax (GST {invoice.gstRate || 18}%):</Typography>
                                    <Typography variant="body2">
                                        {formatCurrency(invoice.totalTax || 0)}
                                    </Typography>
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        Grand Total:
                                    </Typography>
                                    <Typography variant="h6" fontWeight="bold">
                                        {formatCurrency(invoice.grandTotal || 0)}
                                    </Typography>
                                </Box>

                                {invoice.paidAmount > 0 && (
                                    <>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="success.main">
                                                Paid Amount:
                                            </Typography>
                                            <Typography variant="body2" color="success.main">
                                                {formatCurrency(invoice.paidAmount || 0)}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="h6" fontWeight="bold" color="error">
                                                Balance Due:
                                            </Typography>
                                            <Typography variant="h6" fontWeight="bold" color="error">
                                                {formatCurrency(invoice.balanceAmount || 0)}
                                            </Typography>
                                        </Box>
                                    </>
                                )}

                                {invoice.notes && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Notes
                                        </Typography>
                                        <Typography variant="body2">{invoice.notes}</Typography>
                                    </>
                                )}

                                {invoice.termsAndConditions && (
                                    <>
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="caption" color="text.secondary">
                                            Terms & Conditions
                                        </Typography>
                                        <Typography variant="body2" fontSize="0.75rem">
                                            {invoice.termsAndConditions}
                                        </Typography>
                                    </>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Add Payment Dialog */}
            <Dialog open={paymentDialog} onClose={() => setPaymentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Payment</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Alert severity="info">
                                Balance Amount: {formatCurrency(invoice.balanceAmount)}
                            </Alert>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Payment Amount *"
                                value={paymentForm.amount}
                                onChange={(e) => setPaymentForm({ ...paymentForm, amount: parseFloat(e.target.value) })}
                                InputProps={{ startAdornment: currencySymbol }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Payment Date *"
                                value={paymentForm.paymentDate}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                select
                                fullWidth
                                label="Payment Method *"
                                value={paymentForm.paymentMethod}
                                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                            >
                                <MenuItem value="Cash">Cash</MenuItem>
                                <MenuItem value="Cheque">Cheque</MenuItem>
                                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                                <MenuItem value="Online">Online</MenuItem>
                                <MenuItem value="Credit">Credit</MenuItem>
                                <MenuItem value="UPI">UPI</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Reference Number"
                                value={paymentForm.reference}
                                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Remarks"
                                value={paymentForm.remarks}
                                onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddPayment} variant="contained" color="success">
                        Add Payment
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InvoiceDetails;

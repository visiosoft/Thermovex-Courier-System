import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    Chip,
    Tabs,
    Tab,
    Card,
    CardContent,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import {
    ArrowBack,
    Edit,
    Add,
    Delete,
    CheckCircle,
    AttachMoney,
    Receipt,
    LocalShipping
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { shipperAPI, consigneeAPI, chequeAPI, ticketAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const ShipperDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { formatCurrency } = useSettings();
    const [shipper, setShipper] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    // Consignees
    const [consignees, setConsignees] = useState([]);
    const [openConsigneeDialog, setOpenConsigneeDialog] = useState(false);
    const [selectedConsignee, setSelectedConsignee] = useState(null);
    const [consigneeForm, setConsigneeForm] = useState({
        name: '',
        email: '',
        mobile: '',
        company: '',
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Pakistan'
        },
        taxId: '',
        notes: '',
        isDefault: false
    });

    // Cheques
    const [cheques, setCheques] = useState([]);
    const [openChequeDialog, setOpenChequeDialog] = useState(false);
    const [chequeForm, setChequeForm] = useState({
        chequeNumber: '',
        bankName: '',
        branchName: '',
        amount: 0,
        chequeDate: '',
        reference: '',
        notes: ''
    });

    // Tickets
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        fetchShipperDetails();
        fetchStats();
        fetchConsignees();
        fetchCheques();
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchShipperDetails = async () => {
        try {
            const response = await shipperAPI.getById(id);
            setShipper(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch shipper details');
            navigate('/shippers');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await shipperAPI.getStats(id);
            setStats(response.data.data);
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    const fetchConsignees = async () => {
        try {
            const response = await consigneeAPI.getByShipper(id);
            setConsignees(response.data.data);
        } catch (error) {
            console.error('Failed to fetch consignees');
        }
    };

    const fetchCheques = async () => {
        try {
            const response = await chequeAPI.getByShipper(id);
            setCheques(response.data.data);
        } catch (error) {
            console.error('Failed to fetch cheques');
        }
    };

    const fetchTickets = async () => {
        try {
            const response = await ticketAPI.getByShipper(id);
            setTickets(response.data.data);
        } catch (error) {
            console.error('Failed to fetch tickets');
        }
    };

    // Consignee handlers
    const handleOpenConsigneeDialog = (consignee = null) => {
        if (consignee) {
            setSelectedConsignee(consignee);
            setConsigneeForm({
                name: consignee.name,
                email: consignee.email || '',
                mobile: consignee.mobile,
                company: consignee.company || '',
                address: consignee.address,
                taxId: consignee.taxId || '',
                notes: consignee.notes || '',
                isDefault: consignee.isDefault
            });
        } else {
            setSelectedConsignee(null);
            setConsigneeForm({
                name: '',
                email: '',
                mobile: '',
                company: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Pakistan'
                },
                taxId: '',
                notes: '',
                isDefault: false
            });
        }
        setOpenConsigneeDialog(true);
    };

    const handleConsigneeSubmit = async () => {
        try {
            const data = { ...consigneeForm, shipper: id };

            if (selectedConsignee) {
                await consigneeAPI.update(selectedConsignee._id, data);
                toast.success('Consignee updated successfully');
            } else {
                await consigneeAPI.create(data);
                toast.success('Consignee created successfully');
            }

            setOpenConsigneeDialog(false);
            fetchConsignees();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDeleteConsignee = async (consigneeId) => {
        if (window.confirm('Are you sure you want to delete this consignee?')) {
            try {
                await consigneeAPI.delete(consigneeId);
                toast.success('Consignee deleted successfully');
                fetchConsignees();
            } catch (error) {
                toast.error('Delete failed');
            }
        }
    };

    // Cheque handlers
    const handleOpenChequeDialog = () => {
        setChequeForm({
            chequeNumber: '',
            bankName: '',
            branchName: '',
            amount: 0,
            chequeDate: '',
            reference: '',
            notes: ''
        });
        setOpenChequeDialog(true);
    };

    const handleChequeSubmit = async () => {
        try {
            const data = { ...chequeForm, shipper: id };
            await chequeAPI.create(data);
            toast.success('Cheque recorded successfully');
            setOpenChequeDialog(false);
            fetchCheques();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleChequeStatusUpdate = async (chequeId, status) => {
        try {
            const bounceReason = status === 'Bounced' ? prompt('Enter bounce reason:') : '';
            await chequeAPI.updateStatus(chequeId, status, bounceReason);
            toast.success('Cheque status updated');
            fetchCheques();
        } catch (error) {
            toast.error('Update failed');
        }
    };

    if (loading) {
        return <Typography sx={{ p: 3 }}>Loading...</Typography>;
    }

    if (!shipper) {
        return <Typography sx={{ p: 3 }}>Shipper not found</Typography>;
    }

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/shippers')} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h4">{shipper.company}</Typography>
                    <Typography variant="body2" color="textSecondary">
                        {shipper.name} • {shipper.email}
                    </Typography>
                </Box>
                <Chip
                    label={shipper.status}
                    color={shipper.status === 'Active' ? 'success' : 'default'}
                />
                {shipper.isVerified && (
                    <Chip label="Verified" color="success" sx={{ ml: 1 }} />
                )}
            </Box>

            {/* Statistics Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocalShipping color="primary" />
                                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                    Total Bookings
                                </Typography>
                            </Box>
                            <Typography variant="h4">{stats?.totalBookings || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <AttachMoney color="success" />
                                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                    Total Revenue
                                </Typography>
                            </Box>
                            <Typography variant="h4">{formatCurrency(stats?.totalRevenue || 0)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Receipt color="warning" />
                                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                    Pending COD
                                </Typography>
                            </Box>
                            <Typography variant="h4">{formatCurrency(stats?.pendingCOD || 0)}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <CheckCircle color="info" />
                                <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                                    Consignees
                                </Typography>
                            </Box>
                            <Typography variant="h4">{consignees.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Details" />
                    <Tab label={`Consignees (${consignees.length})`} />
                    <Tab label={`Cheques (${cheques.length})`} />
                    <Tab label={`Tickets (${tickets.length})`} />
                </Tabs>
            </Paper>

            {/* Tab Panels */}
            {tabValue === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Contact Information</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {shipper.email}</Typography>
                            <Typography variant="body2"><strong>Mobile:</strong> {shipper.mobile}</Typography>
                            {shipper.phone && <Typography variant="body2"><strong>Phone:</strong> {shipper.phone}</Typography>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Address</Typography>
                            <Typography variant="body2">{shipper.address.street}</Typography>
                            <Typography variant="body2">
                                {shipper.address.city}, {shipper.address.state} {shipper.address.postalCode}
                            </Typography>
                            <Typography variant="body2">{shipper.address.country}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Business Information</Typography>
                            {shipper.taxId && <Typography variant="body2"><strong>Tax ID:</strong> {shipper.taxId}</Typography>}
                            {shipper.ntn && <Typography variant="body2"><strong>NTN:</strong> {shipper.ntn}</Typography>}
                            {shipper.strn && <Typography variant="body2"><strong>STRN:</strong> {shipper.strn}</Typography>}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Account Settings</Typography>
                            <Typography variant="body2"><strong>Payment Type:</strong> {shipper.paymentType}</Typography>
                            <Typography variant="body2"><strong>Credit Limit:</strong> {formatCurrency(shipper.creditLimit)}</Typography>
                            <Typography variant="body2"><strong>Current Balance:</strong> {formatCurrency(shipper.currentBalance)}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {tabValue === 1 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Consignees</Typography>
                        {hasPermission('shipper', 'add') && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Add />}
                                onClick={() => handleOpenConsigneeDialog()}
                            >
                                Add Consignee
                            </Button>
                        )}
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Mobile</TableCell>
                                    <TableCell>City</TableCell>
                                    <TableCell>Default</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {consignees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No consignees found</TableCell>
                                    </TableRow>
                                ) : (
                                    consignees.map((consignee) => (
                                        <TableRow key={consignee._id}>
                                            <TableCell>{consignee.name}</TableCell>
                                            <TableCell>{consignee.mobile}</TableCell>
                                            <TableCell>{consignee.address.city}</TableCell>
                                            <TableCell>
                                                {consignee.isDefault && <Chip label="Default" color="primary" size="small" />}
                                            </TableCell>
                                            <TableCell align="right">
                                                {hasPermission('shipper', 'edit') && (
                                                    <IconButton size="small" onClick={() => handleOpenConsigneeDialog(consignee)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                )}
                                                {hasPermission('shipper', 'delete') && (
                                                    <IconButton size="small" onClick={() => handleDeleteConsignee(consignee._id)} color="error">
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {tabValue === 2 && (
                <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">Cheques</Typography>
                        {hasPermission('payments', 'add') && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Add />}
                                onClick={handleOpenChequeDialog}
                            >
                                Record Cheque
                            </Button>
                        )}
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cheque #</TableCell>
                                    <TableCell>Bank</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {cheques.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">No cheques found</TableCell>
                                    </TableRow>
                                ) : (
                                    cheques.map((cheque) => (
                                        <TableRow key={cheque._id}>
                                            <TableCell>{cheque.chequeNumber}</TableCell>
                                            <TableCell>{cheque.bankName}</TableCell>
                                            <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                                            <TableCell>{new Date(cheque.chequeDate).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={cheque.status}
                                                    color={
                                                        cheque.status === 'Cleared' ? 'success' :
                                                            cheque.status === 'Bounced' ? 'error' :
                                                                cheque.status === 'Pending' ? 'warning' : 'default'
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                {hasPermission('payments', 'edit') && cheque.status === 'Pending' && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            onClick={() => handleChequeStatusUpdate(cheque._id, 'Cleared')}
                                                            sx={{ mr: 1 }}
                                                        >
                                                            Clear
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleChequeStatusUpdate(cheque._id, 'Bounced')}
                                                        >
                                                            Bounce
                                                        </Button>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {tabValue === 3 && (
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Support Tickets</Typography>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ticket #</TableCell>
                                    <TableCell>Subject</TableCell>
                                    <TableCell>Priority</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Created</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center">No tickets found</TableCell>
                                    </TableRow>
                                ) : (
                                    tickets.map((ticket) => (
                                        <TableRow key={ticket._id}>
                                            <TableCell>{ticket.ticketNumber}</TableCell>
                                            <TableCell>{ticket.subject}</TableCell>
                                            <TableCell>
                                                <Chip label={ticket.priority} size="small" />
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={ticket.status} size="small" />
                                            </TableCell>
                                            <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Consignee Dialog */}
            <Dialog open={openConsigneeDialog} onClose={() => setOpenConsigneeDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>{selectedConsignee ? 'Edit Consignee' : 'Add Consignee'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={consigneeForm.name}
                                onChange={(e) => setConsigneeForm({ ...consigneeForm, name: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Mobile"
                                value={consigneeForm.mobile}
                                onChange={(e) => setConsigneeForm({ ...consigneeForm, mobile: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={consigneeForm.email}
                                onChange={(e) => setConsigneeForm({ ...consigneeForm, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Company"
                                value={consigneeForm.company}
                                onChange={(e) => setConsigneeForm({ ...consigneeForm, company: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Street Address"
                                value={consigneeForm.address.street}
                                onChange={(e) => setConsigneeForm({
                                    ...consigneeForm,
                                    address: { ...consigneeForm.address, street: e.target.value }
                                })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="City"
                                value={consigneeForm.address.city}
                                onChange={(e) => setConsigneeForm({
                                    ...consigneeForm,
                                    address: { ...consigneeForm.address, city: e.target.value }
                                })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Postal Code"
                                value={consigneeForm.address.postalCode}
                                onChange={(e) => setConsigneeForm({
                                    ...consigneeForm,
                                    address: { ...consigneeForm.address, postalCode: e.target.value }
                                })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConsigneeDialog(false)}>Cancel</Button>
                    <Button onClick={handleConsigneeSubmit} variant="contained">
                        {selectedConsignee ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Cheque Dialog */}
            <Dialog open={openChequeDialog} onClose={() => setOpenChequeDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Record Cheque</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cheque Number"
                                value={chequeForm.chequeNumber}
                                onChange={(e) => setChequeForm({ ...chequeForm, chequeNumber: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Amount"
                                type="number"
                                value={chequeForm.amount}
                                onChange={(e) => setChequeForm({ ...chequeForm, amount: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Bank Name"
                                value={chequeForm.bankName}
                                onChange={(e) => setChequeForm({ ...chequeForm, bankName: e.target.value })}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Branch Name"
                                value={chequeForm.branchName}
                                onChange={(e) => setChequeForm({ ...chequeForm, branchName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Cheque Date"
                                type="date"
                                value={chequeForm.chequeDate}
                                onChange={(e) => setChequeForm({ ...chequeForm, chequeDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Reference"
                                value={chequeForm.reference}
                                onChange={(e) => setChequeForm({ ...chequeForm, reference: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                value={chequeForm.notes}
                                onChange={(e) => setChequeForm({ ...chequeForm, notes: e.target.value })}
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenChequeDialog(false)}>Cancel</Button>
                    <Button onClick={handleChequeSubmit} variant="contained">Record</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ShipperDetails;

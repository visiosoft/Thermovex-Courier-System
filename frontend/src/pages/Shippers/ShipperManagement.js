import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    Search,
    Visibility,
    CheckCircle,
    Block
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { shipperAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ShipperManagement = () => {
    const { hasPermission } = useAuth();
    const navigate = useNavigate();
    const [shippers, setShippers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedShipper, setSelectedShipper] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        mobile: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Pakistan'
        },
        returnAddress: {
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Pakistan'
        },
        taxId: '',
        ntn: '',
        strn: '',
        paymentType: 'COD',
        creditLimit: 0,
        notes: ''
    });

    useEffect(() => {
        fetchShippers();
    }, [statusFilter]);

    const fetchShippers = async () => {
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;

            const response = await shipperAPI.getAll(params);
            setShippers(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch shippers');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (shipper = null) => {
        if (shipper) {
            setSelectedShipper(shipper);
            setFormData({
                name: shipper.name,
                company: shipper.company,
                email: shipper.email,
                mobile: shipper.mobile,
                phone: shipper.phone || '',
                address: shipper.address,
                returnAddress: shipper.returnAddress || {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Pakistan'
                },
                taxId: shipper.taxId || '',
                ntn: shipper.ntn || '',
                strn: shipper.strn || '',
                paymentType: shipper.paymentType,
                creditLimit: shipper.creditLimit || 0,
                notes: shipper.notes || ''
            });
        } else {
            setSelectedShipper(null);
            setFormData({
                name: '',
                company: '',
                email: '',
                mobile: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Pakistan'
                },
                returnAddress: {
                    street: '',
                    city: '',
                    state: '',
                    postalCode: '',
                    country: 'Pakistan'
                },
                taxId: '',
                ntn: '',
                strn: '',
                paymentType: 'COD',
                creditLimit: 0,
                notes: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedShipper(null);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith('address.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                address: {
                    ...formData.address,
                    [field]: value
                }
            });
        } else if (name.startsWith('returnAddress.')) {
            const field = name.split('.')[1];
            setFormData({
                ...formData,
                returnAddress: {
                    ...formData.returnAddress,
                    [field]: value
                }
            });
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmit = async () => {
        try {
            if (selectedShipper) {
                await shipperAPI.update(selectedShipper._id, formData);
                toast.success('Shipper updated successfully');
            } else {
                await shipperAPI.create(formData);
                toast.success('Shipper created successfully');
            }
            handleCloseDialog();
            fetchShippers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (shipperId) => {
        if (window.confirm('Are you sure you want to delete this shipper?')) {
            try {
                await shipperAPI.delete(shipperId);
                toast.success('Shipper deleted successfully');
                fetchShippers();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Delete failed');
            }
        }
    };

    const handleVerify = async (shipperId) => {
        try {
            await shipperAPI.verify(shipperId);
            toast.success('Shipper verification status updated');
            fetchShippers();
        } catch (error) {
            toast.error('Failed to update verification status');
        }
    };

    const handleViewDetails = (shipperId) => {
        navigate(`/shippers/${shipperId}`);
    };

    const filteredShippers = shippers.filter(
        (shipper) =>
            shipper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shipper.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shipper.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shipper.mobile.includes(searchQuery)
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'success';
            case 'Inactive': return 'default';
            case 'Suspended': return 'warning';
            case 'Blocked': return 'error';
            default: return 'default';
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Shipper Management</Typography>
                {hasPermission('shipper', 'add') && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Add Shipper
                    </Button>
                )}
            </Box>

            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={8}>
                        <TextField
                            fullWidth
                            placeholder="Search shippers by name, company, email, or mobile..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Status Filter</InputLabel>
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                label="Status Filter"
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Active">Active</MenuItem>
                                <MenuItem value="Inactive">Inactive</MenuItem>
                                <MenuItem value="Suspended">Suspended</MenuItem>
                                <MenuItem value="Blocked">Blocked</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Paper>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Company</TableCell>
                            <TableCell>Contact Person</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Mobile</TableCell>
                            <TableCell>City</TableCell>
                            <TableCell>Payment Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : filteredShippers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">
                                    No shippers found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredShippers.map((shipper) => (
                                <TableRow key={shipper._id}>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2" fontWeight="bold">
                                                {shipper.company}
                                            </Typography>
                                            {shipper.isVerified && (
                                                <Chip
                                                    label="Verified"
                                                    color="success"
                                                    size="small"
                                                    sx={{ mt: 0.5 }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{shipper.name}</TableCell>
                                    <TableCell>{shipper.email}</TableCell>
                                    <TableCell>{shipper.mobile}</TableCell>
                                    <TableCell>{shipper.address?.city}</TableCell>
                                    <TableCell>
                                        <Chip label={shipper.paymentType} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={shipper.status}
                                            color={getStatusColor(shipper.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleViewDetails(shipper._id)}
                                            title="View Details"
                                        >
                                            <Visibility fontSize="small" />
                                        </IconButton>
                                        {hasPermission('shipper', 'edit') && (
                                            <>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleOpenDialog(shipper)}
                                                    title="Edit"
                                                >
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleVerify(shipper._id)}
                                                    title={shipper.isVerified ? 'Unverify' : 'Verify'}
                                                    color={shipper.isVerified ? 'success' : 'default'}
                                                >
                                                    <CheckCircle fontSize="small" />
                                                </IconButton>
                                            </>
                                        )}
                                        {hasPermission('shipper', 'delete') && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(shipper._id)}
                                                title="Delete"
                                                color="error"
                                            >
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

            {/* Add/Edit Shipper Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedShipper ? 'Edit Shipper' : 'Add New Shipper'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom>
                                Basic Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Company Name"
                                name="company"
                                value={formData.company}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Contact Person"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Mobile"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Phone (Optional)"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                                Address
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Street Address"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="City"
                                name="address.city"
                                value={formData.address.city}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="State/Province"
                                name="address.state"
                                value={formData.address.state}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Postal Code"
                                name="address.postalCode"
                                value={formData.address.postalCode}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                                Business Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Tax ID"
                                name="taxId"
                                value={formData.taxId}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="NTN"
                                name="ntn"
                                value={formData.ntn}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="STRN"
                                name="strn"
                                value={formData.strn}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" color="primary" gutterBottom sx={{ mt: 2 }}>
                                Account Settings
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Payment Type</InputLabel>
                                <Select
                                    name="paymentType"
                                    value={formData.paymentType}
                                    onChange={handleChange}
                                    label="Payment Type"
                                >
                                    <MenuItem value="COD">COD</MenuItem>
                                    <MenuItem value="Prepaid">Prepaid</MenuItem>
                                    <MenuItem value="Credit">Credit</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Credit Limit"
                                name="creditLimit"
                                type="number"
                                value={formData.creditLimit}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedShipper ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ShipperManagement;

import React, { useState, useEffect } from 'react';
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
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Alert,
    Checkbox,
    FormControlLabel,
    FormGroup,
    Tooltip,
    Autocomplete
} from '@mui/material';
import {
    Add,
    Refresh,
    Delete,
    Visibility,
    Code,
    ContentCopy,
    VpnKey
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../services/api';
import { toast } from 'react-toastify';

const ApiKeyManagement = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [shippers, setShippers] = useState([]);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState(null);
    const [newCredentials, setNewCredentials] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        shipperId: '',
        permissions: ['booking.create', 'booking.read', 'tracking.read', 'rate.calculate'],
        environment: 'sandbox',
        rateLimit: {
            requestsPerMinute: 60,
            requestsPerDay: 10000
        },
        ipWhitelist: '',
        webhookUrl: '',
        expiresAt: '',
        notes: ''
    });

    useEffect(() => {
        fetchApiKeys();
        fetchShippers();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const response = await api.get('/api-keys');
            setApiKeys(response.data.apiKeys || []);
        } catch (error) {
            console.error('Error fetching API keys:', error);
            toast.error('Failed to fetch API keys');
        }
    };

    const fetchShippers = async () => {
        try {
            const response = await api.get('/shippers');
            setShippers(response.data.shippers || []);
        } catch (error) {
            console.error('Error fetching shippers:', error);
        }
    };

    const handleCreate = async () => {
        try {
            const payload = {
                ...formData,
                ipWhitelist: formData.ipWhitelist ? formData.ipWhitelist.split(',').map(ip => ip.trim()) : []
            };

            const response = await api.post('/api-keys', payload);
            setNewCredentials({
                key: response.data.apiKey.key,
                secret: response.data.apiKey.secret
            });
            toast.success('API key created successfully');
            fetchApiKeys();
            setFormData({
                name: '',
                shipperId: '',
                permissions: ['booking.create', 'booking.read', 'tracking.read', 'rate.calculate'],
                environment: 'sandbox',
                rateLimit: { requestsPerMinute: 60, requestsPerDay: 10000 },
                ipWhitelist: '',
                webhookUrl: '',
                expiresAt: '',
                notes: ''
            });
        } catch (error) {
            console.error('Error creating API key:', error);
            toast.error(error.response?.data?.message || 'Failed to create API key');
        }
    };

    const handleRevoke = async (id) => {
        if (!window.confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
            return;
        }

        try {
            await api.delete(`/api-keys/${id}`);
            toast.success('API key revoked successfully');
            fetchApiKeys();
        } catch (error) {
            console.error('Error revoking API key:', error);
            toast.error('Failed to revoke API key');
        }
    };

    const handleViewStats = async (apiKey) => {
        try {
            const response = await api.get(`/api-keys/${apiKey._id}/stats`);
            setSelectedKey(response.data);
            setViewDialogOpen(true);
        } catch (error) {
            console.error('Error fetching stats:', error);
            toast.error('Failed to fetch API key statistics');
        }
    };

    const handleRegenerate = async (id) => {
        if (!window.confirm('Regenerating the secret will invalidate the old secret. Continue?')) {
            return;
        }

        try {
            const response = await api.post(`/api-keys/${id}/regenerate`);
            setNewCredentials({
                key: response.data.key,
                secret: response.data.secret,
                regenerated: true
            });
            toast.success('API secret regenerated successfully');
        } catch (error) {
            console.error('Error regenerating secret:', error);
            toast.error('Failed to regenerate secret');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const getStatusColor = (status) => {
        const colors = {
            'Active': 'success',
            'Inactive': 'warning',
            'Revoked': 'error'
        };
        return colors[status] || 'default';
    };

    const permissionOptions = [
        { value: 'booking.create', label: 'Create Bookings' },
        { value: 'booking.read', label: 'Read Bookings' },
        { value: 'booking.update', label: 'Update Bookings' },
        { value: 'tracking.read', label: 'Track Shipments' },
        { value: 'invoice.read', label: 'Read Invoices' },
        { value: 'rate.calculate', label: 'Calculate Rates' }
    ];

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">API Key Management</Typography>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<Code />}
                        onClick={() => window.open('/api-docs', '_blank')}
                    >
                        API Documentation
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={fetchApiKeys}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setCreateDialogOpen(true)}
                    >
                        Create API Key
                    </Button>
                </Box>
            </Box>

            {/* API Keys Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>API Key</TableCell>
                            <TableCell>Shipper</TableCell>
                            <TableCell>Environment</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Usage Today</TableCell>
                            <TableCell>Last Used</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {apiKeys.map((apiKey) => (
                            <TableRow key={apiKey._id}>
                                <TableCell>{apiKey.name}</TableCell>
                                <TableCell>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2" fontFamily="monospace">
                                            {apiKey.key.substring(0, 20)}...
                                        </Typography>
                                        <IconButton size="small" onClick={() => copyToClipboard(apiKey.key)}>
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </TableCell>
                                <TableCell>{apiKey.shipper?.companyName || 'N/A'}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={apiKey.environment}
                                        size="small"
                                        color={apiKey.environment === 'production' ? 'primary' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={apiKey.status}
                                        size="small"
                                        color={getStatusColor(apiKey.status)}
                                    />
                                </TableCell>
                                <TableCell>
                                    {apiKey.usage?.requestsToday || 0} / {apiKey.rateLimit?.requestsPerDay || 0}
                                </TableCell>
                                <TableCell>
                                    {apiKey.usage?.lastUsed
                                        ? format(new Date(apiKey.usage.lastUsed), 'MMM dd, HH:mm')
                                        : 'Never'}
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="View Statistics">
                                        <IconButton size="small" onClick={() => handleViewStats(apiKey)}>
                                            <Visibility />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Regenerate Secret">
                                        <IconButton size="small" onClick={() => handleRegenerate(apiKey._id)}>
                                            <VpnKey />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Revoke">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleRevoke(apiKey._id)}
                                            disabled={apiKey.status === 'Revoked'}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create API Key Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="API Key Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Production API Key"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={shippers}
                                getOptionLabel={(option) => option.companyName || ''}
                                value={shippers.find(s => s._id === formData.shipperId) || null}
                                onChange={(e, newValue) => setFormData({ ...formData, shipperId: newValue?._id || '' })}
                                renderInput={(params) => (
                                    <TextField {...params} label="Shipper" required />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Environment</InputLabel>
                                <Select
                                    value={formData.environment}
                                    label="Environment"
                                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                                >
                                    <MenuItem value="sandbox">Sandbox</MenuItem>
                                    <MenuItem value="production">Production</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Expires At (Optional)"
                                type="date"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" gutterBottom>
                                Permissions
                            </Typography>
                            <FormGroup>
                                <Grid container>
                                    {permissionOptions.map((perm) => (
                                        <Grid item xs={12} sm={6} key={perm.value}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={formData.permissions.includes(perm.value)}
                                                        onChange={(e) => {
                                                            const newPerms = e.target.checked
                                                                ? [...formData.permissions, perm.value]
                                                                : formData.permissions.filter(p => p !== perm.value);
                                                            setFormData({ ...formData, permissions: newPerms });
                                                        }}
                                                    />
                                                }
                                                label={perm.label}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </FormGroup>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Requests Per Minute"
                                type="number"
                                value={formData.rateLimit.requestsPerMinute}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    rateLimit: { ...formData.rateLimit, requestsPerMinute: parseInt(e.target.value) }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Requests Per Day"
                                type="number"
                                value={formData.rateLimit.requestsPerDay}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    rateLimit: { ...formData.rateLimit, requestsPerDay: parseInt(e.target.value) }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="IP Whitelist (Optional)"
                                value={formData.ipWhitelist}
                                onChange={(e) => setFormData({ ...formData, ipWhitelist: e.target.value })}
                                placeholder="192.168.1.1, 192.168.1.2"
                                helperText="Comma-separated IP addresses. Leave empty to allow all IPs."
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Webhook URL (Optional)"
                                value={formData.webhookUrl}
                                onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                                placeholder="https://your-domain.com/webhook"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Notes (Optional)"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate}>
                        Create API Key
                    </Button>
                </DialogActions>
            </Dialog>

            {/* New Credentials Dialog */}
            <Dialog open={!!newCredentials} onClose={() => setNewCredentials(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {newCredentials?.regenerated ? 'Secret Regenerated' : 'API Key Created'}
                </DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Please save these credentials securely. The secret will not be shown again!
                    </Alert>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="body2" color="textSecondary">
                                API Key
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                                    {newCredentials?.key}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(newCredentials?.key)}>
                                    <ContentCopy fontSize="small" />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                    <Card variant="outlined">
                        <CardContent>
                            <Typography variant="body2" color="textSecondary">
                                API Secret
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                                    {newCredentials?.secret}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(newCredentials?.secret)}>
                                    <ContentCopy fontSize="small" />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={() => setNewCredentials(null)}>
                        I've Saved the Credentials
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Stats Dialog */}
            <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>API Key Statistics</DialogTitle>
                <DialogContent>
                    {selectedKey && (
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">API Key Details</Typography>
                                <Typography variant="body2">Name: {selectedKey.apiKey?.name}</Typography>
                                <Typography variant="body2">Shipper: {selectedKey.apiKey?.shipper}</Typography>
                                <Typography variant="body2">Environment: {selectedKey.apiKey?.environment}</Typography>
                                <Typography variant="body2">Status: {selectedKey.apiKey?.status}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Usage Statistics</Typography>
                                <Typography variant="body2">Total Requests: {selectedKey.usage?.totalRequests}</Typography>
                                <Typography variant="body2">Requests Today: {selectedKey.usage?.requestsToday}</Typography>
                                <Typography variant="body2">Remaining Today: {selectedKey.usage?.remainingToday}</Typography>
                                <Typography variant="body2">
                                    Last Used: {selectedKey.usage?.lastUsed
                                        ? format(new Date(selectedKey.usage.lastUsed), 'MMM dd, yyyy HH:mm:ss')
                                        : 'Never'}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle2">Rate Limits</Typography>
                                <Typography variant="body2">Per Minute: {selectedKey.limits?.requestsPerMinute}</Typography>
                                <Typography variant="body2">Per Day: {selectedKey.limits?.requestsPerDay}</Typography>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ApiKeyManagement;

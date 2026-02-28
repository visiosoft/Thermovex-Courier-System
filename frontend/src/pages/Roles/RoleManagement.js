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
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    FormGroup,
    FormControlLabel,
    Checkbox
} from '@mui/material';
import {
    Add,
    Edit,
    Delete,
    ContentCopy,
    ExpandMore
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { roleAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const modules = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'booking', label: 'Booking Management' },
    { key: 'tracking', label: 'Consignment Tracking' },
    { key: 'invoicing', label: 'Invoicing' },
    { key: 'shipper', label: 'Shipper Management' },
    { key: 'users', label: 'User Management' },
    { key: 'roles', label: 'Role Management' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'complaints', label: 'Complaint Management' },
    { key: 'api', label: 'API Management' },
    { key: 'payments', label: 'Payment Management' },
    { key: 'settings', label: 'System Settings' }
];

const permissions = ['canView', 'canAdd', 'canEdit', 'canDelete', 'canExport', 'canPrint'];

const RoleManagement = () => {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        dataScope: 'own',
        permissions: {}
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await roleAPI.getAll();
            setRoles(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    const initializePermissions = () => {
        const perms = {};
        modules.forEach(module => {
            perms[module.key] = {
                canView: false,
                canAdd: false,
                canEdit: false,
                canDelete: false,
                canExport: false,
                canPrint: false
            };
        });
        return perms;
    };

    const handleOpenDialog = (role = null) => {
        if (role) {
            setSelectedRole(role);
            setFormData({
                name: role.name,
                description: role.description || '',
                dataScope: role.dataScope,
                permissions: role.permissions
            });
        } else {
            setSelectedRole(null);
            setFormData({
                name: '',
                description: '',
                dataScope: 'own',
                permissions: initializePermissions()
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedRole(null);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePermissionChange = (moduleKey, permission) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                [moduleKey]: {
                    ...formData.permissions[moduleKey],
                    [permission]: !formData.permissions[moduleKey]?.[permission]
                }
            }
        });
    };

    const handleSubmit = async () => {
        try {
            if (selectedRole) {
                await roleAPI.update(selectedRole._id, formData);
                toast.success('Role updated successfully');
            } else {
                await roleAPI.create(formData);
                toast.success('Role created successfully');
            }
            handleCloseDialog();
            fetchRoles();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (roleId) => {
        if (window.confirm('Are you sure you want to delete this role?')) {
            try {
                await roleAPI.delete(roleId);
                toast.success('Role deleted successfully');
                fetchRoles();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Delete failed');
            }
        }
    };

    const handleDuplicate = async (role) => {
        const newName = prompt('Enter name for the duplicated role:');
        if (newName) {
            try {
                await roleAPI.duplicate(role._id, { newName });
                toast.success('Role duplicated successfully');
                fetchRoles();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Duplication failed');
            }
        }
    };

    const handleInitDefaults = async () => {
        if (window.confirm('Initialize default system roles? This will create Super Admin, Admin, Operations Manager, Agent, and Shipper roles.')) {
            try {
                await roleAPI.initDefaults();
                toast.success('Default roles initialized');
                fetchRoles();
            } catch (error) {
                toast.error('Failed to initialize default roles');
            }
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Role Management</Typography>
                <Box>
                    <Button
                        variant="outlined"
                        onClick={handleInitDefaults}
                        sx={{ mr: 1 }}
                    >
                        Init Defaults
                    </Button>
                    {hasPermission('roles', 'add') && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog()}
                        >
                            Add Role
                        </Button>
                    )}
                </Box>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Role Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Data Scope</TableCell>
                            <TableCell>System Role</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : roles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No roles found
                                </TableCell>
                            </TableRow>
                        ) : (
                            roles.map((role) => (
                                <TableRow key={role._id}>
                                    <TableCell>
                                        <strong>{role.name}</strong>
                                    </TableCell>
                                    <TableCell>{role.description}</TableCell>
                                    <TableCell>
                                        <Chip label={role.dataScope} size="small" />
                                    </TableCell>
                                    <TableCell>
                                        {role.isSystemRole && (
                                            <Chip label="System" color="primary" size="small" />
                                        )}
                                    </TableCell>
                                    <TableCell align="right">
                                        {hasPermission('roles', 'edit') && !role.isSystemRole && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(role)}
                                                title="Edit"
                                            >
                                                <Edit fontSize="small" />
                                            </IconButton>
                                        )}
                                        {hasPermission('roles', 'add') && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDuplicate(role)}
                                                title="Duplicate"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        )}
                                        {hasPermission('roles', 'delete') && !role.isSystemRole && (
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(role._id)}
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

            {/* Add/Edit Role Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                <DialogTitle>
                    {selectedRole ? 'Edit Role' : 'Create New Role'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Role Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Data Scope"
                                name="dataScope"
                                value={formData.dataScope}
                                onChange={handleChange}
                                SelectProps={{ native: true }}
                            >
                                <option value="own">Own Data Only</option>
                                <option value="branch">Branch Level</option>
                                <option value="zone">Zone Level</option>
                                <option value="all">All Data</option>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                multiline
                                rows={2}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                                Module Permissions
                            </Typography>
                            {modules.map((module) => (
                                <Accordion key={module.key}>
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Typography>{module.label}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <FormGroup row>
                                            {permissions.map((perm) => (
                                                <FormControlLabel
                                                    key={perm}
                                                    control={
                                                        <Checkbox
                                                            checked={formData.permissions[module.key]?.[perm] || false}
                                                            onChange={() => handlePermissionChange(module.key, perm)}
                                                        />
                                                    }
                                                    label={perm.replace('can', '')}
                                                />
                                            ))}
                                        </FormGroup>
                                    </AccordionDetails>
                                </Accordion>
                            ))}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedRole ? 'Update' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default RoleManagement;

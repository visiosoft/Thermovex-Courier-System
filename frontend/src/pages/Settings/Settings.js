import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    Divider,
    Switch,
    FormControlLabel,
    Tab,
    Tabs,
    MenuItem
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const Settings = () => {
    const { fetchSettings: refreshSettings } = useSettings();
    const [tabValue, setTabValue] = useState(0);
    const [generalSettings, setGeneralSettings] = useState({
        companyName: 'Thermovex Courier Services',
        email: 'info@thermovex.com',
        phone: '+1234567890',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: '',
        currency: 'INR',
        gstNumber: '',
        panNumber: ''
    });

    const [systemSettings, setSystemSettings] = useState({
        autoGenerateAWB: true,
        autoGenerateInvoice: true,
        awbPrefix: 'AWB',
        invoicePrefix: 'INV',
        emailNotifications: true,
        smsNotifications: false,
        bookingConfirmation: true,
        deliveryNotification: true,
        paymentConfirmation: true
    });

    const [pricingSettings, setPricingSettings] = useState({
        baseRate: 50,
        perKgRate: 10,
        fuelSurcharge: 5,
        gstRate: 18,
        codCharges: 2,
        handlingCharges: 25
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/settings');
            if (response.data.general) setGeneralSettings(response.data.general);
            if (response.data.system) setSystemSettings(response.data.system);
            if (response.data.pricing) setPricingSettings(response.data.pricing);
        } catch (error) {
            console.log('Using default settings');
        }
    };

    const handleSaveGeneral = async () => {
        try {
            await api.put('/settings/general', generalSettings);
            await refreshSettings(); // Refresh settings context to update all components
            toast.success('General settings saved successfully');
        } catch (error) {
            toast.error('Failed to save general settings');
        }
    };

    const handleSaveSystem = async () => {
        try {
            await api.put('/settings/system', systemSettings);
            await refreshSettings(); // Refresh settings context
            toast.success('System settings saved successfully');
        } catch (error) {
            toast.error('Failed to save system settings');
        }
    };

    const handleSavePricing = async () => {
        try {
            await api.put('/settings/pricing', pricingSettings);
            await refreshSettings(); // Refresh settings context
            toast.success('Pricing settings saved successfully');
        } catch (error) {
            toast.error('Failed to save pricing settings');
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>

            <Paper>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="General" />
                    <Tab label="System" />
                    <Tab label="Pricing" />
                </Tabs>

                {/* General Settings Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Company Information</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Company Name"
                                value={generalSettings.companyName}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, companyName: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Email"
                                value={generalSettings.email}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, email: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Phone"
                                value={generalSettings.phone}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, phone: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Address"
                                value={generalSettings.address}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, address: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="City"
                                value={generalSettings.city}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, city: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="State"
                                value={generalSettings.state}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, state: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="ZIP Code"
                                value={generalSettings.zipCode}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, zipCode: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Country"
                                value={generalSettings.country}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, country: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="GST Number"
                                value={generalSettings.gstNumber}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, gstNumber: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="PAN Number"
                                value={generalSettings.panNumber}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, panNumber: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                select
                                label="Currency"
                                value={generalSettings.currency}
                                onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                            >
                                <MenuItem value="INR">INR (₹) - Indian Rupee</MenuItem>
                                <MenuItem value="USD">USD ($) - US Dollar</MenuItem>
                                <MenuItem value="EUR">EUR (€) - Euro</MenuItem>
                                <MenuItem value="GBP">GBP (£) - British Pound</MenuItem>
                                <MenuItem value="AED">AED (د.إ) - UAE Dirham</MenuItem>
                                <MenuItem value="SAR">SAR (﷼) - Saudi Riyal</MenuItem>
                                <MenuItem value="SGD">SGD ($) - Singapore Dollar</MenuItem>
                                <MenuItem value="AUD">AUD ($) - Australian Dollar</MenuItem>
                                <MenuItem value="CAD">CAD ($) - Canadian Dollar</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveGeneral}
                            >
                                Save General Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* System Settings Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Auto Generation</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.autoGenerateAWB}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, autoGenerateAWB: e.target.checked })}
                                    />
                                }
                                label="Auto Generate AWB Number"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.autoGenerateInvoice}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, autoGenerateInvoice: e.target.checked })}
                                    />
                                }
                                label="Auto Generate Invoice Number"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="AWB Prefix"
                                value={systemSettings.awbPrefix}
                                onChange={(e) => setSystemSettings({ ...systemSettings, awbPrefix: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Invoice Prefix"
                                value={systemSettings.invoicePrefix}
                                onChange={(e) => setSystemSettings({ ...systemSettings, invoicePrefix: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Notifications</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.emailNotifications}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, emailNotifications: e.target.checked })}
                                    />
                                }
                                label="Enable Email Notifications"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.smsNotifications}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, smsNotifications: e.target.checked })}
                                    />
                                }
                                label="Enable SMS Notifications"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.bookingConfirmation}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, bookingConfirmation: e.target.checked })}
                                    />
                                }
                                label="Booking Confirmation"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.deliveryNotification}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, deliveryNotification: e.target.checked })}
                                    />
                                }
                                label="Delivery Notification"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={systemSettings.paymentConfirmation}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, paymentConfirmation: e.target.checked })}
                                    />
                                }
                                label="Payment Confirmation"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSaveSystem}
                            >
                                Save System Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* Pricing Settings Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Typography variant="h6" gutterBottom>Default Pricing</Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Base Rate (₹)"
                                value={pricingSettings.baseRate}
                                onChange={(e) => setPricingSettings({ ...pricingSettings, baseRate: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Per KG Rate (₹)"
                                value={pricingSettings.perKgRate}
                                onChange={(e) => setPricingSettings({ ...pricingSettings, perKgRate: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Fuel Surcharge (%)"
                                value={pricingSettings.fuelSurcharge}
                                onChange={(e) => setPricingSettings({ ...pricingSettings, fuelSurcharge: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="GST Rate (%)"
                                value={pricingSettings.gstRate}
                                onChange={(e) => setPricingSettings({ ...pricingSettings, gstRate: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="COD Charges (%)"
                                value={pricingSettings.codCharges}
                                onChange={(e) => setPricingSettings({ ...pricingSettings, codCharges: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Handling Charges (₹)"
                                value={pricingSettings.handlingCharges}
                                onChange={(e) => setPricingSettings({ ...pricingSettings, handlingCharges: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={handleSavePricing}
                            >
                                Save Pricing Settings
                            </Button>
                        </Grid>
                    </Grid>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default Settings;

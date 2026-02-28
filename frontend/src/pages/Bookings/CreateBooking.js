import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    Grid,
    MenuItem,
    FormControlLabel,
    Checkbox,
    Autocomplete,
    Divider,
    Card,
    CardContent,
    IconButton
} from '@mui/material';
import { ArrowBack as BackIcon, Save as SaveIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { bookingAPI, shipperAPI, consigneeAPI } from '../../services/api';

const CreateBooking = () => {
    const navigate = useNavigate();

    const [shippers, setShippers] = useState([]);
    const [consignees, setConsignees] = useState([]);
    const [selectedShipper, setSelectedShipper] = useState(null);
    const [useManualConsignee, setUseManualConsignee] = useState(false);
    const [calculatedCharges, setCalculatedCharges] = useState({
        shippingCharges: 0,
        insuranceCharges: 0,
        codCharges: 0,
        fuelSurcharge: 0,
        gstAmount: 0,
        totalAmount: 0
    });

    useEffect(() => {
        fetchShippers();
    }, []);

    const fetchShippers = async () => {
        try {
            const response = await shipperAPI.getAll({ status: 'Active', limit: 1000 });
            setShippers(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch shippers');
        }
    };

    const fetchConsignees = async (shipperId) => {
        try {
            const response = await consigneeAPI.getByShipper(shipperId);
            setConsignees(response.data.data);
        } catch (error) {
            toast.error('Failed to fetch consignees');
        }
    };

    const handleShipperChange = (shipper) => {
        setSelectedShipper(shipper);
        if (shipper) {
            fetchConsignees(shipper._id);
        } else {
            setConsignees([]);
        }
    };

    // eslint-disable-next-line no-unused-vars
    const calculateCharges = (values) => {
        const weight = parseFloat(values.weight) || 0;
        const volumetricWeight = values.dimensions.length && values.dimensions.width && values.dimensions.height
            ? (values.dimensions.length * values.dimensions.width * values.dimensions.height) / (values.dimensions.unit === 'cm' ? 5000 : 139)
            : 0;

        const chargeableWeight = Math.max(weight, volumetricWeight);

        // Base shipping charges (simplified calculation)
        let baseRate = 10; // Base rate per kg
        if (values.serviceType === 'Express') baseRate = 20;
        if (values.serviceType === 'Same Day') baseRate = 30;
        if (values.serviceType === 'International') baseRate = 50;
        if (values.serviceType === 'Economy') baseRate = 5;

        const shippingCharges = chargeableWeight * baseRate;

        // Insurance charges
        const insuranceCharges = values.requiresInsurance
            ? (parseFloat(values.declaredValue) || 0) * 0.01 // 1% of declared value
            : 0;

        // COD charges
        const codCharges = values.paymentMode === 'COD'
            ? (parseFloat(values.codAmount) || 0) * 0.02 // 2% of COD amount
            : 0;

        // Fuel surcharge (10% of shipping charges)
        const fuelSurcharge = shippingCharges * 0.10;

        // Subtotal
        const subtotal = shippingCharges + insuranceCharges + codCharges + fuelSurcharge;

        // GST (18%)
        const gstAmount = subtotal * 0.18;

        // Total
        const totalAmount = subtotal + gstAmount;

        const charges = {
            shippingCharges: parseFloat(shippingCharges.toFixed(2)),
            insuranceCharges: parseFloat(insuranceCharges.toFixed(2)),
            codCharges: parseFloat(codCharges.toFixed(2)),
            fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2)),
            gstAmount: parseFloat(gstAmount.toFixed(2)),
            totalAmount: parseFloat(totalAmount.toFixed(2))
        };

        setCalculatedCharges(charges);
        return charges;
    };

    const validationSchema = Yup.object({
        shipper: Yup.string().required('Shipper is required'),
        description: Yup.string().required('Package description is required'),
        weight: Yup.number().min(0.1, 'Weight must be at least 0.1').required('Weight is required'),
        numberOfPieces: Yup.number().min(1, 'At least 1 piece required').required('Number of pieces is required')
    });

    const initialValues = {
        shipper: '',
        consignee: '',
        consigneeDetails: {
            name: '',
            mobile: '',
            email: '',
            company: '',
            address: {
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'USA'
            }
        },
        serviceType: 'Standard',
        shipmentType: 'Parcel',
        destinationType: 'Local',
        numberOfPieces: 1,
        weight: '',
        weightUnit: 'kg',
        dimensions: {
            length: '',
            width: '',
            height: '',
            unit: 'cm'
        },
        description: '',
        declaredValue: 0,
        currency: 'USD',
        paymentMode: 'COD',
        codAmount: 0,
        referenceNumber: '',
        specialInstructions: '',
        invoiceType: 'Commercial',
        isUrgent: false,
        isFragile: false,
        requiresInsurance: false
    };

    const handleSubmit = async (values, { setSubmitting }) => {
        try {
            const bookingData = {
                ...values,
                ...calculatedCharges
            };

            // Only include consignee if it's a valid ID (not empty string)
            if (!useManualConsignee && values.consignee) {
                bookingData.consignee = values.consignee;
            } else {
                // Remove consignee field if using manual details or if empty
                delete bookingData.consignee;
            }

            const response = await bookingAPI.create(bookingData);
            toast.success(`Booking created successfully! AWB: ${response.data.data.awbNumber}`);
            navigate(`/bookings/${response.data.data._id}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => navigate('/bookings')} sx={{ mr: 2 }}>
                    <BackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold">
                    Create New Booking
                </Typography>
            </Box>

            <Formik
                initialValues={initialValues}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({ values, errors, touched, setFieldValue, isSubmitting }) => (
                    <Form>
                        <Grid container spacing={3}>
                            {/* Shipper Information */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Shipper Information
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Autocomplete
                                            options={shippers}
                                            getOptionLabel={(option) => `${option.name} - ${option.company} (${option.mobile})`}
                                            onChange={(e, value) => {
                                                handleShipperChange(value);
                                                setFieldValue('shipper', value?._id || '');
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Select Shipper *"
                                                    error={touched.shipper && Boolean(errors.shipper)}
                                                    helperText={touched.shipper && errors.shipper}
                                                />
                                            )}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Consignee Information */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography variant="h6">
                                                Consignee Information
                                            </Typography>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={useManualConsignee}
                                                        onChange={(e) => {
                                                            setUseManualConsignee(e.target.checked);
                                                            setFieldValue('consignee', '');
                                                        }}
                                                    />
                                                }
                                                label="Enter manually"
                                            />
                                        </Box>
                                        <Divider sx={{ mb: 2 }} />

                                        {!useManualConsignee ? (
                                            <Autocomplete
                                                options={consignees}
                                                getOptionLabel={(option) => `${option.name} - ${option.mobile} (${option.address.city})`}
                                                onChange={(e, value) => setFieldValue('consignee', value?._id || '')}
                                                disabled={!selectedShipper}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Select Consignee"
                                                        placeholder={!selectedShipper ? 'Select shipper first' : 'Choose consignee'}
                                                    />
                                                )}
                                            />
                                        ) : (
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Name *"
                                                        value={values.consigneeDetails.name}
                                                        onChange={(e) => setFieldValue('consigneeDetails.name', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Mobile *"
                                                        value={values.consigneeDetails.mobile}
                                                        onChange={(e) => setFieldValue('consigneeDetails.mobile', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Email"
                                                        type="email"
                                                        value={values.consigneeDetails.email}
                                                        onChange={(e) => setFieldValue('consigneeDetails.email', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        label="Company"
                                                        value={values.consigneeDetails.company}
                                                        onChange={(e) => setFieldValue('consigneeDetails.company', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField
                                                        fullWidth
                                                        label="Street Address *"
                                                        value={values.consigneeDetails.address.street}
                                                        onChange={(e) => setFieldValue('consigneeDetails.address.street', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="City *"
                                                        value={values.consigneeDetails.address.city}
                                                        onChange={(e) => setFieldValue('consigneeDetails.address.city', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="State *"
                                                        value={values.consigneeDetails.address.state}
                                                        onChange={(e) => setFieldValue('consigneeDetails.address.state', e.target.value)}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} md={4}>
                                                    <TextField
                                                        fullWidth
                                                        label="Postal Code *"
                                                        value={values.consigneeDetails.address.postalCode}
                                                        onChange={(e) => setFieldValue('consigneeDetails.address.postalCode', e.target.value)}
                                                    />
                                                </Grid>
                                            </Grid>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Shipment Details */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Shipment Details
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Service Type"
                                                    value={values.serviceType}
                                                    onChange={(e) => setFieldValue('serviceType', e.target.value)}
                                                >
                                                    <MenuItem value="Express">Express</MenuItem>
                                                    <MenuItem value="Standard">Standard</MenuItem>
                                                    <MenuItem value="Economy">Economy</MenuItem>
                                                    <MenuItem value="Same Day">Same Day</MenuItem>
                                                    <MenuItem value="Overnight">Overnight</MenuItem>
                                                    <MenuItem value="International">International</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Shipment Type"
                                                    value={values.shipmentType}
                                                    onChange={(e) => setFieldValue('shipmentType', e.target.value)}
                                                >
                                                    <MenuItem value="Document">Document</MenuItem>
                                                    <MenuItem value="Parcel">Parcel</MenuItem>
                                                    <MenuItem value="Cargo">Cargo</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Destination Type"
                                                    value={values.destinationType}
                                                    onChange={(e) => setFieldValue('destinationType', e.target.value)}
                                                >
                                                    <MenuItem value="Local">Local</MenuItem>
                                                    <MenuItem value="Domestic">Domestic</MenuItem>
                                                    <MenuItem value="International">International</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Number of Pieces *"
                                                    value={values.numberOfPieces}
                                                    onChange={(e) => setFieldValue('numberOfPieces', e.target.value)}
                                                    error={touched.numberOfPieces && Boolean(errors.numberOfPieces)}
                                                    helperText={touched.numberOfPieces && errors.numberOfPieces}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Weight *"
                                                    value={values.weight}
                                                    onChange={(e) => setFieldValue('weight', e.target.value)}
                                                    error={touched.weight && Boolean(errors.weight)}
                                                    helperText={touched.weight && errors.weight}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={4}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Weight Unit"
                                                    value={values.weightUnit}
                                                    onChange={(e) => setFieldValue('weightUnit', e.target.value)}
                                                >
                                                    <MenuItem value="kg">Kilograms (kg)</MenuItem>
                                                    <MenuItem value="lb">Pounds (lb)</MenuItem>
                                                </TextField>
                                            </Grid>
                                        </Grid>

                                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                                            Dimensions (Optional)
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Length"
                                                    value={values.dimensions.length}
                                                    onChange={(e) => setFieldValue('dimensions.length', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Width"
                                                    value={values.dimensions.width}
                                                    onChange={(e) => setFieldValue('dimensions.width', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Height"
                                                    value={values.dimensions.height}
                                                    onChange={(e) => setFieldValue('dimensions.height', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={6} md={3}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Unit"
                                                    value={values.dimensions.unit}
                                                    onChange={(e) => setFieldValue('dimensions.unit', e.target.value)}
                                                >
                                                    <MenuItem value="cm">Centimeters (cm)</MenuItem>
                                                    <MenuItem value="in">Inches (in)</MenuItem>
                                                </TextField>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Package Contents */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Package Contents
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    label="Description *"
                                                    value={values.description}
                                                    onChange={(e) => setFieldValue('description', e.target.value)}
                                                    error={touched.description && Boolean(errors.description)}
                                                    helperText={touched.description && errors.description}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    type="number"
                                                    label="Declared Value"
                                                    value={values.declaredValue}
                                                    onChange={(e) => setFieldValue('declaredValue', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Invoice Type"
                                                    value={values.invoiceType}
                                                    onChange={(e) => setFieldValue('invoiceType', e.target.value)}
                                                >
                                                    <MenuItem value="Commercial">Commercial</MenuItem>
                                                    <MenuItem value="Gift">Gift</MenuItem>
                                                    <MenuItem value="Performa">Performa</MenuItem>
                                                    <MenuItem value="Sample">Sample</MenuItem>
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    label="Reference Number (Optional)"
                                                    value={values.referenceNumber}
                                                    onChange={(e) => setFieldValue('referenceNumber', e.target.value)}
                                                />
                                            </Grid>
                                            <Grid item xs={12}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={2}
                                                    label="Special Instructions"
                                                    value={values.specialInstructions}
                                                    onChange={(e) => setFieldValue('specialInstructions', e.target.value)}
                                                />
                                            </Grid>
                                        </Grid>

                                        <Box sx={{ mt: 2 }}>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={values.isUrgent}
                                                        onChange={(e) => setFieldValue('isUrgent', e.target.checked)}
                                                    />
                                                }
                                                label="Urgent Shipment"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={values.isFragile}
                                                        onChange={(e) => setFieldValue('isFragile', e.target.checked)}
                                                    />
                                                }
                                                label="Fragile Items"
                                            />
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={values.requiresInsurance}
                                                        onChange={(e) => setFieldValue('requiresInsurance', e.target.checked)}
                                                    />
                                                }
                                                label="Requires Insurance"
                                            />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Payment Information */}
                            <Grid item xs={12}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Payment Information
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={12} md={6}>
                                                <TextField
                                                    fullWidth
                                                    select
                                                    label="Payment Mode"
                                                    value={values.paymentMode}
                                                    onChange={(e) => setFieldValue('paymentMode', e.target.value)}
                                                >
                                                    <MenuItem value="COD">Cash on Delivery (COD)</MenuItem>
                                                    <MenuItem value="Prepaid">Prepaid</MenuItem>
                                                    <MenuItem value="Credit">Credit</MenuItem>
                                                </TextField>
                                            </Grid>
                                            {values.paymentMode === 'COD' && (
                                                <Grid item xs={12} md={6}>
                                                    <TextField
                                                        fullWidth
                                                        type="number"
                                                        label="COD Amount"
                                                        value={values.codAmount}
                                                        onChange={(e) => setFieldValue('codAmount', e.target.value)}
                                                    />
                                                </Grid>
                                            )}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Pricing Summary */}
                            <Grid item xs={12}>
                                <Card sx={{ bgcolor: '#f5f5f5' }}>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Pricing Summary
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />

                                        <Grid container spacing={2}>
                                            <Grid item xs={6}>
                                                <Typography>Shipping Charges:</Typography>
                                            </Grid>
                                            <Grid item xs={6} align="right">
                                                <Typography fontWeight="bold">${calculatedCharges.shippingCharges.toFixed(2)}</Typography>
                                            </Grid>

                                            {calculatedCharges.insuranceCharges > 0 && (
                                                <>
                                                    <Grid item xs={6}>
                                                        <Typography>Insurance:</Typography>
                                                    </Grid>
                                                    <Grid item xs={6} align="right">
                                                        <Typography fontWeight="bold">${calculatedCharges.insuranceCharges.toFixed(2)}</Typography>
                                                    </Grid>
                                                </>
                                            )}

                                            {calculatedCharges.codCharges > 0 && (
                                                <>
                                                    <Grid item xs={6}>
                                                        <Typography>COD Charges:</Typography>
                                                    </Grid>
                                                    <Grid item xs={6} align="right">
                                                        <Typography fontWeight="bold">${calculatedCharges.codCharges.toFixed(2)}</Typography>
                                                    </Grid>
                                                </>
                                            )}

                                            <Grid item xs={6}>
                                                <Typography>Fuel Surcharge:</Typography>
                                            </Grid>
                                            <Grid item xs={6} align="right">
                                                <Typography fontWeight="bold">${calculatedCharges.fuelSurcharge.toFixed(2)}</Typography>
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Typography>GST (18%):</Typography>
                                            </Grid>
                                            <Grid item xs={6} align="right">
                                                <Typography fontWeight="bold">${calculatedCharges.gstAmount.toFixed(2)}</Typography>
                                            </Grid>

                                            <Grid item xs={12}>
                                                <Divider />
                                            </Grid>

                                            <Grid item xs={6}>
                                                <Typography variant="h6">Total Amount:</Typography>
                                            </Grid>
                                            <Grid item xs={6} align="right">
                                                <Typography variant="h6" color="primary" fontWeight="bold">
                                                    ${calculatedCharges.totalAmount.toFixed(2)}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Action Buttons */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate('/bookings')}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Booking'}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
        </Box>
    );
};

export default CreateBooking;

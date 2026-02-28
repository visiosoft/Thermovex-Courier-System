import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Paper,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Search as SearchIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Clear as ClearIcon,
  ReportProblem as ReportIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import axios from 'axios';

const PublicTracking = () => {
  const [awbNumber, setAwbNumber] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({
    type: '',
    description: '',
    reporterName: '',
    reporterEmail: '',
    reporterMobile: ''
  });

  const statusColors = {
    'Booked': 'info',
    'Picked Up': 'primary',
    'In Transit': 'warning',
    'Out for Delivery': 'secondary',
    'Delivered': 'success',
    'Returned': 'error',
    'Cancelled': 'default',
    'On Hold': 'warning',
    'Failed Delivery': 'error'
  };

  const statusIcons = {
    'Booked': <InfoIcon />,
    'Picked Up': <ShippingIcon />,
    'In Transit': <ShippingIcon />,
    'Out for Delivery': <ShippingIcon />,
    'Delivered': <CheckIcon />,
    'Returned': <ErrorIcon />,
    'Cancelled': <ClearIcon />,
    'On Hold': <WarningIcon />,
    'Failed Delivery': <ErrorIcon />
  };

  const handleSearch = async () => {
    if (!awbNumber.trim()) {
      toast.error('Please enter AWB number');
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/bookings/awb/${awbNumber.trim()}`);
      setBooking(response.data.data);
    } catch (error) {
      setBooking(null);
      if (error.response?.status === 404) {
        toast.error('Shipment not found. Please check the AWB number.');
      } else {
        toast.error('Failed to fetch tracking information');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getDeliveryETA = () => {
    if (!booking || booking.status === 'Delivered') return null;

    const bookingDate = new Date(booking.bookingDate);
    let daysToAdd = 3; // Default

    if (booking.serviceType === 'Express') daysToAdd = 1;
    if (booking.serviceType === 'Same Day') daysToAdd = 0;
    if (booking.serviceType === 'Overnight') daysToAdd = 1;
    if (booking.serviceType === 'International') daysToAdd = 7;
    if (booking.serviceType === 'Economy') daysToAdd = 5;

    const eta = new Date(bookingDate);
    eta.setDate(eta.getDate() + daysToAdd);

    return eta;
  };

  const handleReportException = async () => {
    if (!exceptionForm.type || !exceptionForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/exceptions/report', {
        awbNumber: booking.awbNumber,
        type: exceptionForm.type,
        description: exceptionForm.description,
        reportedBy: {
          name: exceptionForm.reporterName,
          email: exceptionForm.reporterEmail,
          mobile: exceptionForm.reporterMobile,
          relationship: 'Customer'
        }
      });

      toast.success('Exception reported successfully. Our team will contact you soon.');
      setReportDialog(false);
      setExceptionForm({
        type: '',
        description: '',
        reporterName: '',
        reporterEmail: '',
        reporterMobile: ''
      });
    } catch (error) {
      toast.error('Failed to report exception');
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Track Your Shipment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter your AWB number to track your package in real-time
          </Typography>
        </Box>

        {/* Search Box */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                placeholder="Enter AWB Number (e.g., AWB24XXXXXXX)"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="primary" />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: '1.2rem',
                    fontWeight: 500
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleSearch}
                disabled={loading}
                sx={{
                  py: 2,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Track Shipment'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Loading State */}
        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2, color: 'white' }}>
              Fetching tracking information...
            </Typography>
          </Box>
        )}

        {/* Not Found State */}
        {searched && !booking && !loading && (
          <Alert severity="error" sx={{ fontSize: '1.1rem' }}>
            <Typography variant="h6">Shipment Not Found</Typography>
            <Typography>
              We couldn't find a shipment with AWB number: <strong>{awbNumber}</strong>
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Please check the number and try again. Contact customer support if the issue persists.
            </Typography>
          </Alert>
        )}

        {/* Tracking Results */}
        {booking && !loading && (
          <>
            {/* Current Status Card */}
            <Card sx={{ mb: 3, borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                          {booking.awbNumber}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          Booked on {new Date(booking.bookingDate).toLocaleString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={booking.status}
                        color={statusColors[booking.status] || 'default'}
                        icon={statusIcons[booking.status]}
                        sx={{
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          px: 3,
                          py: 3
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Shipment Details */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      FROM
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {booking.shipper?.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.shipper?.company}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      TO
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {booking.consignee?.name || booking.consigneeDetails?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.consignee?.address?.city || booking.consigneeDetails?.address?.city},{' '}
                      {booking.consignee?.address?.state || booking.consigneeDetails?.address?.state}{' '}
                      {booking.consignee?.address?.postalCode || booking.consigneeDetails?.address?.postalCode}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      SERVICE TYPE
                    </Typography>
                    <Chip label={booking.serviceType} color="primary" />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      WEIGHT
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {booking.weight} {booking.weightUnit}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      PIECES
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {booking.numberOfPieces}
                    </Typography>
                  </Grid>

                  {/* ETA */}
                  {booking.status !== 'Delivered' && booking.status !== 'Cancelled' && getDeliveryETA() && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ fontSize: '1rem' }}>
                        <Typography variant="body1">
                          <strong>Estimated Delivery:</strong> {getDeliveryETA().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}

                  {/* Delivery Info */}
                  {booking.status === 'Delivered' && (
                    <Grid item xs={12}>
                      <Alert severity="success" sx={{ fontSize: '1rem' }}>
                        <Typography variant="h6" gutterBottom>
                          ✓ Delivered Successfully
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography>
                              <strong>Delivered On:</strong> {new Date(booking.deliveryDate).toLocaleString()}
                            </Typography>
                          </Grid>
                          {booking.deliveredTo && (
                            <Grid item xs={12} md={6}>
                              <Typography>
                                <strong>Received By:</strong> {booking.deliveredTo}
                              </Typography>
                            </Grid>
                          )}
                          {booking.deliveryRemarks && (
                            <Grid item xs={12}>
                              <Typography>
                                <strong>Remarks:</strong> {booking.deliveryRemarks}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Tracking Timeline */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Tracking History
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {booking.statusHistory && booking.statusHistory.length > 0 ? (
                  <Box>
                    {booking.statusHistory.slice().reverse().map((history, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 3,
                          pl: 3,
                          borderLeft: 4,
                          borderColor: statusColors[history.status] || 'grey.500',
                          position: 'relative'
                        }}
                      >
                        <Paper elevation={2} sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Chip
                              icon={statusIcons[history.status] || <ShippingIcon />}
                              label={history.status}
                              color={statusColors[history.status] || 'default'}
                              sx={{ fontWeight: 'bold' }}
                            />
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {new Date(history.timestamp).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(history.timestamp).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          </Box>
                          {history.location && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              📍 {history.location}
                            </Typography>
                          )}
                          {history.remarks && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {history.remarks}
                            </Typography>
                          )}
                        </Paper>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">
                    No tracking history available yet.
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Report Problem Button */}
            {booking.status !== 'Delivered' && booking.status !== 'Cancelled' && (
              <Card sx={{ mt: 3, borderRadius: 3, bgcolor: '#fff3e0' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Have an Issue?
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Report any problems with your shipment and we'll resolve it quickly.
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="warning"
                      startIcon={<ReportIcon />}
                      onClick={() => setReportDialog(true)}
                      sx={{ minWidth: 150 }}
                    >
                      Report Problem
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Additional Information */}
            {booking.referenceNumber && (
              <Card sx={{ mt: 3, borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reference Number:</strong> {booking.referenceNumber}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <Card sx={{ mt: 3, borderRadius: 3, bgcolor: '#f5f5f5' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Need Help?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  If you have any questions about your shipment, please contact our customer support at:
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    📞 Phone: 1-800-THERMOVEX
                  </Typography>
                  <Typography variant="body2">
                    📧 Email: support@thermovex.com
                  </Typography>
                  <Typography variant="body2">
                    🕐 Hours: Monday - Saturday, 9 AM - 6 PM
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </>
        )}
      </Container>

      {/* Report Exception Dialog */}
      <Dialog open={reportDialog} onClose={() => setReportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Report a Problem</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              fullWidth
              label="Problem Type *"
              value={exceptionForm.type}
              onChange={(e) => setExceptionForm({ ...exceptionForm, type: e.target.value })}
            >
              <MenuItem value="Damaged Package">Damaged Package</MenuItem>
              <MenuItem value="Missing Items">Missing Items</MenuItem>
              <MenuItem value="Wrong Address">Wrong Address</MenuItem>
              <MenuItem value="Delivery Delay">Delivery Delay</MenuItem>
              <MenuItem value="Package Lost">Package Lost</MenuItem>
              <MenuItem value="Delivery Refused">Delivery Refused</MenuItem>
              <MenuItem value="Wrong Item Delivered">Wrong Item Delivered</MenuItem>
              <MenuItem value="Customer Not Available">Customer Not Available</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description *"
              placeholder="Please describe the issue in detail..."
              value={exceptionForm.description}
              onChange={(e) => setExceptionForm({ ...exceptionForm, description: e.target.value })}
            />

            <Divider />
            <Typography variant="subtitle2" color="text.secondary">
              Your Contact Information
            </Typography>

            <TextField
              fullWidth
              label="Name *"
              value={exceptionForm.reporterName}
              onChange={(e) => setExceptionForm({ ...exceptionForm, reporterName: e.target.value })}
            />

            <TextField
              fullWidth
              label="Email *"
              type="email"
              value={exceptionForm.reporterEmail}
              onChange={(e) => setExceptionForm({ ...exceptionForm, reporterEmail: e.target.value })}
            />

            <TextField
              fullWidth
              label="Mobile *"
              value={exceptionForm.reporterMobile}
              onChange={(e) => setExceptionForm({ ...exceptionForm, reporterMobile: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleReportException}
            variant="contained"
            color="warning"
            disabled={!exceptionForm.type || !exceptionForm.description}
          >
            Submit Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PublicTracking;

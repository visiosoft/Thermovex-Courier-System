import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    CircularProgress,
    Alert,
    Autocomplete
} from '@mui/material';
import {
    Assessment,
    PictureAsPdf,
    TableChart
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import api from '../../services/api';
import { toast } from 'react-toastify';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const BookingReport = () => {
    const { formatCurrency } = useSettings();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [shippers, setShippers] = useState([]);
    const [filters, setFilters] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        status: '',
        serviceType: '',
        shipperId: ''
    });

    React.useEffect(() => {
        fetchShippers();
    }, []);

    const fetchShippers = async () => {
        try {
            const response = await api.get('/shippers');
            setShippers(response.data.shippers || []);
        } catch (error) {
            console.error('Error fetching shippers:', error);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            const response = await api.post('/reports/bookings', filters);
            setReportData(response.data);
            toast.success('Report generated successfully');
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const exportReport = async (format) => {
        if (!reportData) {
            toast.error('Please generate report first');
            return;
        }

        try {
            setExporting(true);
            const response = await api.post(
                `/reports/export/${format}`,
                {
                    reportType: 'booking',
                    data: reportData,
                    filters
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `booking-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Report exported to ${format.toUpperCase()}`);
        } catch (error) {
            console.error('Error exporting report:', error);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const formatChartDate = (item) => {
        if (item._id) {
            return `${item._id.month}/${item._id.day}`;
        }
        return '';
    };

    const getStatusColor = (status) => {
        const colors = {
            'Delivered': 'success',
            'In Transit': 'info',
            'Out for Delivery': 'primary',
            'Picked Up': 'warning',
            'Booked': 'default',
            'Cancelled': 'error',
            'Returned': 'error'
        };
        return colors[status] || 'default';
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Booking Report
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Report Filters
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filters.status}
                                label="Status"
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Booked">Booked</MenuItem>
                                <MenuItem value="Picked Up">Picked Up</MenuItem>
                                <MenuItem value="In Transit">In Transit</MenuItem>
                                <MenuItem value="Out for Delivery">Out for Delivery</MenuItem>
                                <MenuItem value="Delivered">Delivered</MenuItem>
                                <MenuItem value="Returned">Returned</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <FormControl fullWidth>
                            <InputLabel>Service Type</InputLabel>
                            <Select
                                value={filters.serviceType}
                                label="Service Type"
                                onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                            >
                                <MenuItem value="">All</MenuItem>
                                <MenuItem value="Express">Express</MenuItem>
                                <MenuItem value="Standard">Standard</MenuItem>
                                <MenuItem value="Economy">Economy</MenuItem>
                                <MenuItem value="Same Day">Same Day</MenuItem>
                                <MenuItem value="Overnight">Overnight</MenuItem>
                                <MenuItem value="International">International</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Autocomplete
                            options={shippers}
                            getOptionLabel={(option) => option.companyName || ''}
                            value={shippers.find(s => s._id === filters.shipperId) || null}
                            onChange={(e, newValue) => handleFilterChange('shipperId', newValue?._id || '')}
                            renderInput={(params) => (
                                <TextField {...params} label="Shipper (Optional)" />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Button
                            variant="contained"
                            startIcon={<Assessment />}
                            onClick={generateReport}
                            disabled={loading}
                            fullWidth
                        >
                            {loading ? <CircularProgress size={24} /> : 'Generate Report'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Report Results */}
            {reportData && (
                <>
                    {/* Export Buttons */}
                    <Box mb={3} display="flex" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<PictureAsPdf />}
                            onClick={() => exportReport('pdf')}
                            disabled={exporting}
                        >
                            Export to PDF
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<TableChart />}
                            onClick={() => exportReport('excel')}
                            disabled={exporting}
                        >
                            Export to Excel
                        </Button>
                    </Box>

                    {/* Summary Cards */}
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Bookings
                                    </Typography>
                                    <Typography variant="h4">
                                        {reportData.summary.totalBookings}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Amount
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatCurrency(reportData.summary.totalAmount)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Avg Booking Value
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatCurrency(reportData.summary.avgBookingValue)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Weight
                                    </Typography>
                                    <Typography variant="h4">
                                        {reportData.summary.totalWeight?.toFixed(2)} kg
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} mb={3}>
                        {/* Daily Trend */}
                        <Grid item xs={12} lg={8}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Daily Booking Trend
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={reportData.dailyTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={formatChartDate} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="count" stroke="#0088FE" name="Bookings" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Status Breakdown */}
                        <Grid item xs={12} lg={4}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Status Distribution
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.statusBreakdown}
                                            dataKey="count"
                                            nameKey="_id"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {reportData.statusBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Service Type Breakdown */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Bookings by Service Type
                                </Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={reportData.serviceBreakdown}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="_id" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#8884D8">
                                            {reportData.serviceBreakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Top Shippers */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Top Shippers by Booking Count
                                </Typography>
                                <TableContainer sx={{ maxHeight: 250 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Shipper</TableCell>
                                                <TableCell align="right">Bookings</TableCell>
                                                <TableCell align="right">Revenue</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.topShippers?.map((shipper, index) => (
                                                <TableRow key={shipper._id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>{shipper.shipperInfo.companyName}</TableCell>
                                                    <TableCell align="right">{shipper.bookingCount}</TableCell>
                                                    <TableCell align="right">{formatCurrency(shipper.totalRevenue)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Booking Details Table */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Bookings (Top 100)
                        </Typography>
                        <TableContainer sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>AWB Number</TableCell>
                                        <TableCell>Shipper</TableCell>
                                        <TableCell>Service Type</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell align="right">Weight</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell>Date</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.bookings?.map((booking) => (
                                        <TableRow key={booking._id}>
                                            <TableCell>{booking.awbNumber}</TableCell>
                                            <TableCell>{booking.shipper?.companyName || 'N/A'}</TableCell>
                                            <TableCell>{booking.serviceType}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={booking.status}
                                                    size="small"
                                                    color={getStatusColor(booking.status)}
                                                />
                                            </TableCell>
                                            <TableCell align="right">{booking.weight} kg</TableCell>
                                            <TableCell align="right">{formatCurrency(booking.totalAmount)}</TableCell>
                                            <TableCell>{format(new Date(booking.createdAt), 'MMM dd, yyyy')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </>
            )}

            {!reportData && !loading && (
                <Alert severity="info">
                    Select filters and click "Generate Report" to view booking analytics
                </Alert>
            )}
        </Box>
    );
};

export default BookingReport;

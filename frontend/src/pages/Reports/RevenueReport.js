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
    CircularProgress,
    Alert,
    Autocomplete
} from '@mui/material';
import {
    Assessment,
    PictureAsPdf,
    TableChart,
    DateRange
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

const RevenueReport = () => {
    const { formatCurrency, currencySymbol } = useSettings();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [shippers, setShippers] = useState([]);
    const [filters, setFilters] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        shipperId: '',
        groupBy: 'day'
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
            const response = await api.post('/reports/revenue', filters);
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
                    reportType: 'revenue',
                    data: reportData,
                    filters
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `revenue-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
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
            if (item._id.day) {
                return `${item._id.month}/${item._id.day}`;
            } else if (item._id.week) {
                return `W${item._id.week}`;
            } else {
                return `${item._id.year}-${item._id.month}`;
            }
        }
        return '';
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Revenue Report
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
                    <Grid item xs={12} md={3}>
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
                    <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                            <InputLabel>Group By</InputLabel>
                            <Select
                                value={filters.groupBy}
                                label="Group By"
                                onChange={(e) => handleFilterChange('groupBy', e.target.value)}
                            >
                                <MenuItem value="day">Day</MenuItem>
                                <MenuItem value="week">Week</MenuItem>
                                <MenuItem value="month">Month</MenuItem>
                            </Select>
                        </FormControl>
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
                                        Total Revenue
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatCurrency(reportData.summary.totalRevenue)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Total Paid
                                    </Typography>
                                    <Typography variant="h4" color="success.main">
                                        {formatCurrency(reportData.summary.totalPaid)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Outstanding
                                    </Typography>
                                    <Typography variant="h4" color="warning.main">
                                        {formatCurrency(reportData.summary.totalOutstanding)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" variant="body2">
                                        Invoice Count
                                    </Typography>
                                    <Typography variant="h4">
                                        {reportData.summary.invoiceCount}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} mb={3}>
                        {/* Revenue Trend */}
                        <Grid item xs={12} lg={8}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Revenue Trend
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={reportData.revenueByPeriod}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey={formatChartDate} />
                                        <YAxis tickFormatter={(value) => `${currencySymbol}${value / 1000}k`} />
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                        <Legend />
                                        <Line type="monotone" dataKey="totalRevenue" stroke="#0088FE" name="Total Revenue" />
                                        <Line type="monotone" dataKey="paidAmount" stroke="#00C49F" name="Paid" />
                                        <Line type="monotone" dataKey="outstandingAmount" stroke="#FF8042" name="Outstanding" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Revenue by Service */}
                        <Grid item xs={12} lg={4}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Revenue by Service Type
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.revenueByService}
                                            dataKey="revenue"
                                            nameKey="_id"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {reportData.revenueByService.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Payment Method Breakdown */}
                        {reportData.paymentByMethod?.length > 0 && (
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ p: 2 }}>
                                    <Typography variant="h6" gutterBottom>
                                        Revenue by Payment Gateway
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={reportData.paymentByMethod}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="_id" />
                                            <YAxis tickFormatter={(value) => `${currencySymbol}${value / 1000}k`} />
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                            <Bar dataKey="totalAmount" fill="#8884D8">
                                                {reportData.paymentByMethod.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                        )}

                        {/* Top Shippers */}
                        <Grid item xs={12} md={6}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Top Revenue Generating Shippers
                                </Typography>
                                <TableContainer sx={{ maxHeight: 300 }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Shipper</TableCell>
                                                <TableCell align="right">Revenue</TableCell>
                                                <TableCell align="right">Invoices</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportData.revenueByShipper?.slice(0, 10).map((shipper, index) => (
                                                <TableRow key={shipper._id}>
                                                    <TableCell>{index + 1}</TableCell>
                                                    <TableCell>{shipper.shipperInfo.companyName}</TableCell>
                                                    <TableCell align="right">{formatCurrency(shipper.totalRevenue)}</TableCell>
                                                    <TableCell align="right">{shipper.invoiceCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}

            {!reportData && !loading && (
                <Alert severity="info" icon={<DateRange />}>
                    Select date range and click "Generate Report" to view revenue analytics
                </Alert>
            )}
        </Box>
    );
};

export default RevenueReport;

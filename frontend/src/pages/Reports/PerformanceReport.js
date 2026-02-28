import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import {
    Box,
    Paper,
    Typography,
    Grid,
    TextField,
    Button,
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
    LinearProgress
} from '@mui/material';
import {
    Assessment,
    PictureAsPdf,
    TableChart,
    TrendingUp,
    CheckCircle,
    Error
} from '@mui/icons-material';
import { format } from 'date-fns';
import {
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

const PerformanceReport = () => {
    const { formatCurrency } = useSettings();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState({
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });

    const handleFilterChange = (field, value) => {
        setFilters({ ...filters, [field]: value });
    };

    const generateReport = async () => {
        try {
            setLoading(true);
            const response = await api.post('/reports/performance', filters);
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
                    reportType: 'performance',
                    data: reportData,
                    filters
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `performance-report-${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`);
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

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Performance Report
            </Typography>

            {/* Filters */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Report Period
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Button
                            variant="contained"
                            startIcon={<Assessment />}
                            onClick={generateReport}
                            disabled={loading}
                            fullWidth
                            sx={{ height: '56px' }}
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

                    {/* Key Metrics */}
                    <Grid container spacing={3} mb={3}>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <CheckCircle color="success" sx={{ mr: 1 }} />
                                        <Typography color="textSecondary" variant="body2">
                                            Customer Satisfaction Rate
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" color="success.main">
                                        {reportData.satisfactionMetrics.satisfactionRate}%
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {reportData.satisfactionMetrics.totalDeliveries} deliveries, {reportData.satisfactionMetrics.totalExceptions} exceptions
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={reportData.satisfactionMetrics.satisfactionRate}
                                        color="success"
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <TrendingUp color="primary" sx={{ mr: 1 }} />
                                        <Typography color="textSecondary" variant="body2">
                                            Total Deliveries
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" color="primary.main">
                                        {reportData.satisfactionMetrics.totalDeliveries}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Completed in selected period
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" alignItems="center" mb={1}>
                                        <Error color="warning" sx={{ mr: 1 }} />
                                        <Typography color="textSecondary" variant="body2">
                                            Total Exceptions
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" color="warning.main">
                                        {reportData.satisfactionMetrics.totalExceptions}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Issues reported
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} mb={3}>
                        {/* Delivery Performance by Service */}
                        <Grid item xs={12} lg={8}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Delivery Performance by Service Type
                                </Typography>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={reportData.deliveryPerformance}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="_id" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="onTimeDeliveries" fill="#00C49F" name="On-Time" />
                                        <Bar dataKey="delayedDeliveries" fill="#FF8042" name="Delayed" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>

                        {/* Exception Analysis */}
                        <Grid item xs={12} lg={4}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom>
                                    Exception Types
                                </Typography>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={reportData.exceptionAnalysis}
                                            dataKey="count"
                                            nameKey="_id"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label
                                        >
                                            {reportData.exceptionAnalysis.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Performance Details Table */}
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Delivery Performance Details
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Service Type</TableCell>
                                        <TableCell align="right">Total Deliveries</TableCell>
                                        <TableCell align="right">On-Time</TableCell>
                                        <TableCell align="right">Delayed</TableCell>
                                        <TableCell align="right">On-Time Rate</TableCell>
                                        <TableCell align="right">Avg Delivery Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.deliveryPerformance?.map((perf) => {
                                        const onTimeRate = ((perf.onTimeDeliveries / perf.totalDeliveries) * 100).toFixed(1);
                                        return (
                                            <TableRow key={perf._id}>
                                                <TableCell>{perf._id}</TableCell>
                                                <TableCell align="right">{perf.totalDeliveries}</TableCell>
                                                <TableCell align="right">
                                                    <Typography color="success.main">{perf.onTimeDeliveries}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography color="error.main">{perf.delayedDeliveries}</Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        color={parseFloat(onTimeRate) >= 90 ? 'success.main' : 'warning.main'}
                                                        fontWeight="bold"
                                                    >
                                                        {onTimeRate}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">{perf.avgDeliveryDays?.toFixed(1)} days</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Exception Analysis Table */}
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Exception Analysis
                        </Typography>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Exception Type</TableCell>
                                        <TableCell align="right">Count</TableCell>
                                        <TableCell align="right">Resolved</TableCell>
                                        <TableCell align="right">Resolution Rate</TableCell>
                                        <TableCell align="right">Avg Resolution Time</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {reportData.exceptionAnalysis?.map((exc) => {
                                        const resolutionRate = exc.count > 0 ? ((exc.resolved / exc.count) * 100).toFixed(1) : 0;
                                        return (
                                            <TableRow key={exc._id}>
                                                <TableCell>{exc._id}</TableCell>
                                                <TableCell align="right">{exc.count}</TableCell>
                                                <TableCell align="right">{exc.resolved}</TableCell>
                                                <TableCell align="right">
                                                    <Typography
                                                        color={parseFloat(resolutionRate) >= 80 ? 'success.main' : 'warning.main'}
                                                    >
                                                        {resolutionRate}%
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {exc.avgResolutionTime ? `${exc.avgResolutionTime.toFixed(1)} hrs` : 'N/A'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>

                    {/* Financial Performance */}
                    {reportData.financialPerformance && (
                        <Paper sx={{ p: 2, mt: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Financial Performance
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Revenue
                                    </Typography>
                                    <Typography variant="h5">
                                        {formatCurrency(reportData.financialPerformance.totalRevenue || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        COD Collections
                                    </Typography>
                                    <Typography variant="h5">
                                        {formatCurrency(reportData.financialPerformance.codAmount || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Shipping Charges
                                    </Typography>
                                    <Typography variant="h5">
                                        {formatCurrency(reportData.financialPerformance.shippingCharges || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Booking Count
                                    </Typography>
                                    <Typography variant="h5">
                                        {reportData.financialPerformance.bookingCount}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    )}
                </>
            )}

            {!reportData && !loading && (
                <Alert severity="info">
                    Select date range and click "Generate Report" to view performance analytics
                </Alert>
            )}
        </Box>
    );
};

export default PerformanceReport;

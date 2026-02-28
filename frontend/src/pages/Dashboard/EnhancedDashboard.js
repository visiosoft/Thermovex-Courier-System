import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    LocalShipping,
    AttachMoney,
    People,
    Assignment,
    Payment as PaymentIcon,
    Warning,
    CheckCircle,
    Refresh
} from '@mui/icons-material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import api from '../../services/api';
import { useSettings } from '../../context/SettingsContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const EnhancedDashboard = () => {
    const { formatCurrency, currencySymbol } = useSettings();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [period, setPeriod] = useState('30');
    const [overview, setOverview] = useState(null);
    const [revenue, setRevenue] = useState(null);
    const [bookings, setBookings] = useState(null);
    const [performance, setPerformance] = useState(null);
    const [activities, setActivities] = useState(null);

    useEffect(() => {
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [period]);

    const fetchDashboardData = async () => {
        try {
            setRefreshing(true);
            const [overviewRes, revenueRes, bookingsRes, performanceRes, activitiesRes] =
                await Promise.all([
                    api.get('/dashboard/overview'),
                    api.get(`/dashboard/revenue?period=${period}`),
                    api.get(`/dashboard/bookings?period=${period}`),
                    api.get('/dashboard/performance'),
                    api.get('/dashboard/activities?limit=10')
                ]);

            setOverview(overviewRes.data);
            setRevenue(revenueRes.data);
            setBookings(bookingsRes.data);
            setPerformance(performanceRes.data);
            setActivities(activitiesRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const StatCard = ({ title, value, growth, icon, color, prefix = '', suffix = '' }) => (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography color="textSecondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" component="div">
                            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
                        </Typography>
                        {growth !== undefined && (
                            <Box display="flex" alignItems="center" mt={1}>
                                {growth >= 0 ? (
                                    <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} fontSize="small" />
                                ) : (
                                    <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} fontSize="small" />
                                )}
                                <Typography
                                    variant="body2"
                                    sx={{ color: growth >= 0 ? 'success.main' : 'error.main' }}
                                >
                                    {Math.abs(growth)}% vs last month
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}20`,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    const formatChartDate = (item) => {
        if (item._id) {
            return `${item._id.month}/${item._id.day}`;
        }
        return item.date || '';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4">Dashboard</Typography>
                <Box display="flex" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Period</InputLabel>
                        <Select
                            value={period}
                            label="Period"
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <MenuItem value="7">Last 7 Days</MenuItem>
                            <MenuItem value="30">Last 30 Days</MenuItem>
                            <MenuItem value="90">Last 90 Days</MenuItem>
                        </Select>
                    </FormControl>
                    <Tooltip title="Refresh Data">
                        <IconButton onClick={fetchDashboardData} disabled={refreshing}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Overview Stats */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Bookings"
                        value={overview?.thisMonth?.bookings || 0}
                        growth={overview?.growth?.bookings}
                        icon={<LocalShipping sx={{ fontSize: 40, color: '#0088FE' }} />}
                        color="#0088FE"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Revenue This Month"
                        value={overview?.thisMonth?.revenue || 0}
                        growth={overview?.growth?.revenue}
                        icon={<AttachMoney sx={{ fontSize: 40, color: '#00C49F' }} />}
                        color="#00C49F"
                        prefix={currencySymbol}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Shippers"
                        value={overview?.totals?.shippers || 0}
                        icon={<People sx={{ fontSize: 40, color: '#FFBB28' }} />}
                        color="#FFBB28"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Pending Deliveries"
                        value={overview?.pending?.deliveries || 0}
                        icon={<Assignment sx={{ fontSize: 40, color: '#FF8042' }} />}
                        color="#FF8042"
                    />
                </Grid>
            </Grid>

            {/* Performance Metrics */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                                Success Rate
                            </Typography>
                            <Typography variant="h4" sx={{ color: 'success.main' }}>
                                {performance?.successRate || 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                                Collection Rate
                            </Typography>
                            <Typography variant="h4" sx={{ color: 'info.main' }}>
                                {performance?.collectionRate || 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                                Customer Satisfaction
                            </Typography>
                            <Typography variant="h4" sx={{ color: 'primary.main' }}>
                                {performance?.satisfactionRate || 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" variant="body2" gutterBottom>
                                Avg Response Time
                            </Typography>
                            <Typography variant="h4">
                                {performance?.avgResponseTime || 0}h
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
                            <AreaChart data={revenue?.dailyRevenue || []}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey={formatChartDate}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    tickFormatter={formatCurrency}
                                />
                                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                                <Legend />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#00C49F"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    name="Revenue"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="paid"
                                    stroke="#0088FE"
                                    fillOpacity={1}
                                    fill="url(#colorPaid)"
                                    name="Paid"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Revenue by Service Type */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Revenue by Service
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={revenue?.revenueByService || []}
                                    dataKey="revenue"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={(entry) => entry._id}
                                >
                                    {(revenue?.revenueByService || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Booking Trends */}
                <Grid item xs={12} lg={8}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Booking Trends
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={bookings?.dailyBookings || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey={formatChartDate}
                                    tick={{ fontSize: 12 }}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <RechartsTooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#0088FE"
                                    strokeWidth={2}
                                    name="Total Bookings"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="delivered"
                                    stroke="#00C49F"
                                    strokeWidth={2}
                                    name="Delivered"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cancelled"
                                    stroke="#FF8042"
                                    strokeWidth={2}
                                    name="Cancelled"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Bookings by Status */}
                <Grid item xs={12} lg={4}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Bookings by Status
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={bookings?.bookingsByStatus || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" tick={{ fontSize: 11, angle: -45, textAnchor: 'end' }} height={80} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <RechartsTooltip />
                                <Bar dataKey="count" fill="#8884D8">
                                    {(bookings?.bookingsByStatus || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Recent Activities and Alerts */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Bookings
                        </Typography>
                        <List>
                            {activities?.bookings?.slice(0, 5).map((booking) => (
                                <React.Fragment key={booking._id}>
                                    <ListItem>
                                        <ListItemIcon>
                                            <LocalShipping color="primary" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={booking.awbNumber}
                                            secondary={`${booking.shipper?.companyName || 'N/A'} • ${booking.serviceType}`}
                                        />
                                        <Box textAlign="right">
                                            <Chip
                                                label={booking.status}
                                                size="small"
                                                color={booking.status === 'Delivered' ? 'success' : 'default'}
                                            />
                                            <Typography variant="caption" display="block" color="textSecondary">
                                                {format(parseISO(booking.createdAt), 'MMM dd, HH:mm')}
                                            </Typography>
                                        </Box>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Alerts & Notifications
                        </Typography>
                        <List>
                            {overview?.pending?.overdueInvoices > 0 && (
                                <ListItem>
                                    <ListItemIcon>
                                        <Warning color="error" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Overdue Invoices"
                                        secondary={`${overview.pending.overdueInvoices} invoices need attention`}
                                    />
                                </ListItem>
                            )}
                            {overview?.pending?.deliveries > 0 && (
                                <ListItem>
                                    <ListItemIcon>
                                        <Assignment color="warning" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Pending Deliveries"
                                        secondary={`${overview.pending.deliveries} shipments in transit`}
                                    />
                                </ListItem>
                            )}
                            {overview?.pending?.payments > 0 && (
                                <ListItem>
                                    <ListItemIcon>
                                        <PaymentIcon color="info" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="Pending Payments"
                                        secondary={`${overview.pending.payments} payments to process`}
                                    />
                                </ListItem>
                            )}
                            {performance?.recentActivity && (
                                <ListItem>
                                    <ListItemIcon>
                                        <CheckCircle color="success" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary="24h Activity"
                                        secondary={`${performance.recentActivity.deliveries} deliveries, ${performance.recentActivity.newPayments} payments`}
                                    />
                                </ListItem>
                            )}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default EnhancedDashboard;

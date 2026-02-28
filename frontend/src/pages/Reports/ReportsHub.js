import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button
} from '@mui/material';
import {
    Assessment,
    TrendingUp,
    LocalShipping,
    Speed
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ReportsHub = () => {
    const navigate = useNavigate();

    const reports = [
        {
            title: 'Revenue Report',
            description: 'Comprehensive revenue analytics with breakdowns by service type, shipper, and payment gateway',
            icon: <TrendingUp sx={{ fontSize: 60, color: '#00C49F' }} />,
            color: '#00C49F',
            path: '/reports/revenue'
        },
        {
            title: 'Booking Report',
            description: 'Detailed booking analytics including status distribution, service types, and shipper performance',
            icon: <LocalShipping sx={{ fontSize: 60, color: '#0088FE' }} />,
            color: '#0088FE',
            path: '/reports/bookings'
        },
        {
            title: 'Performance Report',
            description: 'Delivery performance metrics, exception analysis, and customer satisfaction tracking',
            icon: <Speed sx={{ fontSize: 60, color: '#FFBB28' }} />,
            color: '#FFBB28',
            path: '/reports/performance'
        }
    ];

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Reports & Analytics
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Generate comprehensive reports and export to PDF or Excel
            </Typography>

            <Grid container spacing={3} mt={2}>
                {reports.map((report) => (
                    <Grid item xs={12} md={4} key={report.title}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1 }}>
                                <Box display="flex" justifyContent="center" mb={2}>
                                    {report.icon}
                                </Box>
                                <Typography variant="h5" gutterBottom align="center">
                                    {report.title}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" align="center">
                                    {report.description}
                                </Typography>
                            </CardContent>
                            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                <Button
                                    variant="contained"
                                    startIcon={<Assessment />}
                                    onClick={() => navigate(report.path)}
                                    sx={{ backgroundColor: report.color, '&:hover': { backgroundColor: report.color, opacity: 0.9 } }}
                                >
                                    Generate Report
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Paper sx={{ p: 3, mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Available Export Formats
                </Typography>
                <Grid container spacing={2} mt={1}>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center">
                            <Assessment color="error" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    PDF Export
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Professional PDF reports with charts and tables, ready for printing or sharing
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center">
                            <Assessment color="success" sx={{ mr: 1 }} />
                            <Box>
                                <Typography variant="subtitle1" fontWeight="bold">
                                    Excel Export
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Detailed Excel spreadsheets with raw data for further analysis and manipulation
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default ReportsHub;

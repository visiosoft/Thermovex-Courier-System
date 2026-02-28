import React from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box
} from '@mui/material';
import {
    LocalShipping,
    CheckCircle,
    Cancel,
    AttachMoney
} from '@mui/icons-material';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const StatCard = ({ title, value, icon, color }) => (
    <Paper
        sx={{
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}
    >
        <Box>
            <Typography color="textSecondary" gutterBottom>
                {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
        </Box>
        <Box
            sx={{
                backgroundColor: color,
                borderRadius: '50%',
                width: 60,
                height: 60,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}
        >
            {icon}
        </Box>
    </Paper>
);

const Dashboard = () => {
    const { user } = useAuth();
    const { currencySymbol } = useSettings();

    return (
        <>
            <Typography variant="h4" gutterBottom>
                Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary" gutterBottom>
                Welcome back, {user?.name}!
            </Typography>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Orders"
                        value="0"
                        icon={<LocalShipping />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Delivered"
                        value="0"
                        icon={<CheckCircle />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Returns"
                        value="0"
                        icon={<Cancel />}
                        color="#d32f2f"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="COD Amount"
                        value={`${currencySymbol}0`}
                        icon={<AttachMoney />}
                        color="#ed6c02"
                    />
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Transactions
                        </Typography>
                        <Typography color="textSecondary">
                            No transactions yet
                        </Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <Typography color="textSecondary">
                            Coming soon...
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </>
    );
};

export default Dashboard;

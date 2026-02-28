import React from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    Divider
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    LocalShipping,
    TrackChanges,
    People,
    Receipt,
    Assessment,
    Security,
    Settings,
    Report,
    Payment,
    VpnKey
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ open, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission } = useAuth();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', module: 'dashboard' },
        { text: 'Bookings', icon: <LocalShipping />, path: '/bookings', module: 'booking' },
        { text: 'Tracking', icon: <TrackChanges />, path: '/tracking', module: 'tracking' },
        { text: 'Shippers', icon: <People />, path: '/shippers', module: 'shipper' },
        { text: 'Invoices', icon: <Receipt />, path: '/invoices', module: 'invoicing' },
        { text: 'Payments', icon: <Payment />, path: '/payments', module: 'payment' },
        { text: 'Reports', icon: <Assessment />, path: '/reports', module: 'reports' },
        { text: 'Complaints', icon: <Report />, path: '/complaints', module: 'complaints' },
    ];

    const adminMenuItems = [
        { text: 'Users', icon: <People />, path: '/users', module: 'users' },
        { text: 'Roles', icon: <Security />, path: '/roles', module: 'roles' },
        { text: 'API Keys', icon: <VpnKey />, path: '/api-keys', module: 'settings' },
        { text: 'Settings', icon: <Settings />, path: '/settings', module: 'settings' },
    ];

    const handleNavigation = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: 240,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: 240,
                    boxSizing: 'border-box',
                    marginTop: '64px',
                },
            }}
        >
            <List>
                {menuItems.map((item) => {
                    if (!hasPermission(item.module, 'view')) return null;

                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => handleNavigation(item.path)}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Divider />
            <List>
                {adminMenuItems.map((item) => {
                    if (!hasPermission(item.module, 'view')) return null;

                    return (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={location.pathname === item.path}
                                onClick={() => handleNavigation(item.path)}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
        </Drawer>
    );
};

export default Sidebar;

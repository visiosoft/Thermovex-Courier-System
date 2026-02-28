import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import EnhancedDashboard from './pages/Dashboard/EnhancedDashboard';
import UserManagement from './pages/Users/UserManagement';
import ReportsHub from './pages/Reports/ReportsHub';
import RevenueReport from './pages/Reports/RevenueReport';
import BookingReport from './pages/Reports/BookingReport';
import PerformanceReport from './pages/Reports/PerformanceReport';
import ApiKeyManagement from './pages/API/ApiKeyManagement';
import RoleManagement from './pages/Roles/RoleManagement';
import ShipperManagement from './pages/Shippers/ShipperManagement';
import ShipperDetails from './pages/Shippers/ShipperDetails';
import BookingManagement from './pages/Bookings/BookingManagement';
import CreateBooking from './pages/Bookings/CreateBooking';
import BookingDetails from './pages/Bookings/BookingDetails';
import EditBooking from './pages/Bookings/EditBooking';
import BulkUpload from './pages/Bookings/BulkUpload';
import PublicTracking from './pages/Tracking/PublicTracking';
import InvoiceManagement from './pages/Invoices/InvoiceManagement';
import CreateInvoice from './pages/Invoices/CreateInvoice';
import InvoiceDetails from './pages/Invoices/InvoiceDetails';
import PaymentManagement from './pages/Payments/PaymentManagement';
import PaymentCheckout from './pages/Payments/PaymentCheckout';
import PaymentSuccess from './pages/Payments/PaymentSuccess';
import ExceptionManagement from './pages/Exceptions/ExceptionManagement';
import Settings from './pages/Settings/Settings';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#dc004e',
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <SettingsProvider>
                    <Router>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/track" element={<PublicTracking />} />

                            {/* Auth Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <EnhancedDashboard />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/users"
                                element={
                                    <ProtectedRoute module="users" action="view">
                                        <Layout>
                                            <UserManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/roles"
                                element={
                                    <ProtectedRoute module="roles" action="view">
                                        <Layout>
                                            <RoleManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/shippers"
                                element={
                                    <ProtectedRoute module="shipper" action="view">
                                        <Layout>
                                            <ShipperManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/shippers/:id"
                                element={
                                    <ProtectedRoute module="shipper" action="view">
                                        <Layout>
                                            <ShipperDetails />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/tracking"
                                element={
                                    <ProtectedRoute module="tracking" action="view">
                                        <Layout>
                                            <PublicTracking />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bookings"
                                element={
                                    <ProtectedRoute module="booking" action="view">
                                        <Layout>
                                            <BookingManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bookings/create"
                                element={
                                    <ProtectedRoute module="booking" action="add">
                                        <Layout>
                                            <CreateBooking />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bookings/bulk-upload"
                                element={
                                    <ProtectedRoute module="booking" action="add">
                                        <Layout>
                                            <BulkUpload />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bookings/:id"
                                element={
                                    <ProtectedRoute module="booking" action="view">
                                        <Layout>
                                            <BookingDetails />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/bookings/:id/edit"
                                element={
                                    <ProtectedRoute module="booking" action="edit">
                                        <Layout>
                                            <EditBooking />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/invoices"
                                element={
                                    <ProtectedRoute module="invoicing" action="view">
                                        <Layout>
                                            <InvoiceManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/invoices/create"
                                element={
                                    <ProtectedRoute module="invoicing" action="add">
                                        <Layout>
                                            <CreateInvoice />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/invoices/:id"
                                element={
                                    <ProtectedRoute module="invoicing" action="view">
                                        <Layout>
                                            <InvoiceDetails />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/payments"
                                element={
                                    <ProtectedRoute module="payments" action="view">
                                        <Layout>
                                            <PaymentManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/payments/checkout/:invoiceId"
                                element={
                                    <ProtectedRoute module="payments" action="add">
                                        <Layout>
                                            <PaymentCheckout />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/payments/paypal/success" element={<PaymentSuccess />} />
                            <Route path="/payments/skrill/success" element={<PaymentSuccess />} />
                            <Route
                                path="/reports"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <ReportsHub />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reports/revenue"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <RevenueReport />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reports/bookings"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <BookingReport />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/reports/performance"
                                element={
                                    <ProtectedRoute>
                                        <Layout>
                                            <PerformanceReport />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/api-keys"
                                element={
                                    <ProtectedRoute module="api" action="view">
                                        <Layout>
                                            <ApiKeyManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/complaints"
                                element={
                                    <ProtectedRoute module="complaints" action="view">
                                        <Layout>
                                            <ExceptionManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/exceptions"
                                element={
                                    <ProtectedRoute module="complaints" action="view">
                                        <Layout>
                                            <ExceptionManagement />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute module="settings" action="view">
                                        <Layout>
                                            <Settings />
                                        </Layout>
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Router>
                </SettingsProvider>
                <ToastContainer position="top-right" autoClose={3000} />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;

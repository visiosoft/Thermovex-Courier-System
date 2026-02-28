import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, module, action }) => {
    const { isAuthenticated, hasPermission, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (module && action && !hasPermission(module, action)) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page.</p>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;

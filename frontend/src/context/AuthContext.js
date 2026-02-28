import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const response = await authAPI.login(credentials);
        const { user, token } = response.data.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const hasPermission = (module, action) => {
        if (!user || !user.permissions || !user.permissions[module]) {
            return false;
        }

        const permission = user.permissions[module];

        switch (action) {
            case 'view':
                return permission.canView;
            case 'add':
                return permission.canAdd;
            case 'edit':
                return permission.canEdit;
            case 'delete':
                return permission.canDelete;
            case 'export':
                return permission.canExport;
            case 'print':
                return permission.canPrint;
            default:
                return false;
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

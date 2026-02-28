import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

const currencySymbols = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    SGD: 'S$',
    AED: 'د.إ',
    SAR: 'ر.س'
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        general: null,
        system: null,
        pricing: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error fetching settings:', error);
            // Set default settings on error
            setSettings({
                general: {
                    companyName: 'Thermovex Courier Services',
                    currency: 'INR',
                    timezone: 'Asia/Kolkata',
                    dateFormat: 'DD/MM/YYYY'
                },
                system: null,
                pricing: null
            });
        } finally {
            setLoading(false);
        }
    };

    const getCurrencySymbol = () => {
        const currency = settings.general?.currency || 'INR';
        return currencySymbols[currency] || currency;
    };

    const formatCurrency = (amount) => {
        const symbol = getCurrencySymbol();
        const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
        return `${symbol}${formattedAmount}`;
    };

    const value = {
        settings,
        loading,
        fetchSettings,
        getCurrencySymbol,
        formatCurrency,
        currency: settings.general?.currency || 'INR',
        currencySymbol: getCurrencySymbol()
    };

    return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

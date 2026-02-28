import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/change-password', data)
};

// User API
export const userAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    toggleBlock: (id) => api.put(`/users/${id}/block`),
    resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
    getActivity: (id) => api.get(`/users/${id}/activity`)
};

// Role API
export const roleAPI = {
    getAll: () => api.get('/roles'),
    getById: (id) => api.get(`/roles/${id}`),
    create: (data) => api.post('/roles', data),
    update: (id, data) => api.put(`/roles/${id}`, data),
    delete: (id) => api.delete(`/roles/${id}`),
    duplicate: (id, data) => api.post(`/roles/${id}/duplicate`, data),
    initDefaults: () => api.post('/roles/init-defaults')
};

// Shipper API
export const shipperAPI = {
    getAll: (params) => api.get('/shippers', { params }),
    getById: (id) => api.get(`/shippers/${id}`),
    create: (data) => api.post('/shippers', data),
    update: (id, data) => api.put(`/shippers/${id}`, data),
    delete: (id) => api.delete(`/shippers/${id}`),
    updateStatus: (id, status) => api.put(`/shippers/${id}/status`, { status }),
    verify: (id) => api.put(`/shippers/${id}/verify`),
    getStats: (id) => api.get(`/shippers/${id}/stats`)
};

// Consignee API
export const consigneeAPI = {
    getAll: (params) => api.get('/consignees', { params }),
    getByShipper: (shipperId) => api.get(`/consignees/shipper/${shipperId}`),
    getById: (id) => api.get(`/consignees/${id}`),
    create: (data) => api.post('/consignees', data),
    update: (id, data) => api.put(`/consignees/${id}`, data),
    delete: (id) => api.delete(`/consignees/${id}`)
};

// Cheque API
export const chequeAPI = {
    getAll: (params) => api.get('/cheques', { params }),
    getByShipper: (shipperId) => api.get(`/cheques/shipper/${shipperId}`),
    getById: (id) => api.get(`/cheques/${id}`),
    create: (data) => api.post('/cheques', data),
    update: (id, data) => api.put(`/cheques/${id}`, data),
    updateStatus: (id, status, bounceReason) => api.put(`/cheques/${id}/status`, { status, bounceReason }),
    delete: (id) => api.delete(`/cheques/${id}`)
};

// Ticket API
export const ticketAPI = {
    getAll: (params) => api.get('/tickets', { params }),
    getByShipper: (shipperId) => api.get(`/tickets/shipper/${shipperId}`),
    getById: (id) => api.get(`/tickets/${id}`),
    create: (data) => api.post('/tickets', data),
    update: (id, data) => api.put(`/tickets/${id}`, data),
    addResponse: (id, message, isInternal) => api.post(`/tickets/${id}/response`, { message, isInternal }),
    assign: (id, assignedTo, department) => api.put(`/tickets/${id}/assign`, { assignedTo, department }),
    escalate: (id, escalatedTo, escalationReason) => api.put(`/tickets/${id}/escalate`, { escalatedTo, escalationReason }),
    resolve: (id, resolution) => api.put(`/tickets/${id}/resolve`, { resolution }),
    close: (id) => api.put(`/tickets/${id}/close`),
    delete: (id) => api.delete(`/tickets/${id}`)
};

// Booking API
export const bookingAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    getByAWB: (awbNumber) => api.get(`/bookings/awb/${awbNumber}`),
    create: (data) => api.post('/bookings', data),
    bulkCreate: (bookings) => api.post('/bookings/bulk', { bookings }),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    delete: (id) => api.delete(`/bookings/${id}`),
    updateStatus: (id, status, location, remarks) => api.put(`/bookings/${id}/status`, { status, location, remarks }),
    cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
    getStats: (params) => api.get('/bookings/stats/summary', { params })
};

// Manifest API
export const manifestAPI = {
    getAll: (params) => api.get('/manifests', { params }),
    getById: (id) => api.get(`/manifests/${id}`),
    create: (data) => api.post('/manifests', data),
    update: (id, data) => api.put(`/manifests/${id}`, data),
    delete: (id) => api.delete(`/manifests/${id}`),
    dispatch: (id) => api.put(`/manifests/${id}/dispatch`)
};

// Dispatch API
export const dispatchAPI = {
    getAll: (params) => api.get('/dispatches', { params }),
    getById: (id) => api.get(`/dispatches/${id}`),
    create: (data) => api.post('/dispatches', data),
    update: (id, data) => api.put(`/dispatches/${id}`, data),
    delete: (id) => api.delete(`/dispatches/${id}`),
    markDispatched: (id) => api.put(`/dispatches/${id}/dispatch`),
    markReceived: (id) => api.put(`/dispatches/${id}/receive`)
};

// Exception API
export const exceptionAPI = {
    getAll: (params) => api.get('/exceptions', { params }),
    getById: (id) => api.get(`/exceptions/${id}`),
    report: (data) => api.post('/exceptions/report', data),
    create: (data) => api.post('/exceptions', data),
    update: (id, data) => api.put(`/exceptions/${id}`, data),
    delete: (id) => api.delete(`/exceptions/${id}`),
    assign: (id, assignedTo) => api.put(`/exceptions/${id}/assign`, { assignedTo }),
    resolve: (id, resolution) => api.put(`/exceptions/${id}/resolve`, { resolution }),
    addNote: (id, note) => api.post(`/exceptions/${id}/notes`, { note })
};

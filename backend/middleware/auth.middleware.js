const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route. Please login.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from token
        req.user = await User.findById(decoded.id).populate('role');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (!req.user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.'
            });
        }

        // Check if user is blocked
        if (req.user.isBlocked) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been blocked. Please contact admin.'
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// Check module permission
exports.checkPermission = (module, action) => {
    return (req, res, next) => {
        const permissions = req.user.role.permissions[module];

        if (!permissions) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. No permissions for this module.'
            });
        }

        let hasPermission = false;

        switch (action) {
            case 'view':
                hasPermission = permissions.canView;
                break;
            case 'add':
                hasPermission = permissions.canAdd;
                break;
            case 'edit':
                hasPermission = permissions.canEdit;
                break;
            case 'delete':
                hasPermission = permissions.canDelete;
                break;
            case 'export':
                hasPermission = permissions.canExport;
                break;
            case 'print':
                hasPermission = permissions.canPrint;
                break;
            default:
                hasPermission = false;
        }

        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `Access denied. You don't have permission to ${action} in ${module} module.`
            });
        }

        next();
    };
};

// Restrict to specific roles
exports.restrictTo = (...roleNames) => {
    return (req, res, next) => {
        if (!roleNames.includes(req.user.role.name)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

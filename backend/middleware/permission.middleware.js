const checkPermission = (module, action) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user || !user.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. No role assigned.'
                });
            }

            const role = user.role;

            // Super Admin has all permissions
            if (role.name === 'Super Admin') {
                return next();
            }

            // Check if user has the specific module permission
            const modulePermissions = role.permissions.find(p => p.module === module);

            if (!modulePermissions) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. No permissions for ${module} module.`
                });
            }

            // Check if the specific action is allowed
            if (!modulePermissions[action]) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. Insufficient permissions for ${action} on ${module}.`
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                message: 'Error checking permissions'
            });
        }
    };
};

module.exports = { checkPermission };

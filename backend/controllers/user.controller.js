const User = require('../models/User.model');
const Role = require('../models/Role.model');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const { search, role, status, page = 1, limit = 10 } = req.query;

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (status === 'active') {
            query.isActive = true;
            query.isBlocked = false;
        } else if (status === 'blocked') {
            query.isBlocked = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        // Execute query with pagination
        const users = await User.find(query)
            .populate('role', 'name')
            .select('-password')
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('role')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new user
// @route   POST /api/users
// @access  Private (Admin)
exports.createUser = async (req, res) => {
    try {
        const { name, email, mobile, password, roleId, branch, zone } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Verify role exists
        const role = await Role.findById(roleId);
        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            mobile,
            password,
            role: roleId,
            branch,
            zone,
            createdBy: req.user._id
        });

        await user.addActivity('user_created', `User created by ${req.user.name}`, req.ip);

        const populatedUser = await User.findById(user._id)
            .populate('role', 'name')
            .select('-password');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: populatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
exports.updateUser = async (req, res) => {
    try {
        const { name, email, mobile, roleId, branch, zone, isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (mobile) user.mobile = mobile;
        if (roleId) user.role = roleId;
        if (branch !== undefined) user.branch = branch;
        if (zone !== undefined) user.zone = zone;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        await user.addActivity('user_updated', `User updated by ${req.user.name}`, req.ip);

        const updatedUser = await User.findById(user._id)
            .populate('role', 'name')
            .select('-password');

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Block/Unblock user
// @route   PUT /api/users/:id/block
// @access  Private (Admin)
exports.toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        await user.addActivity(
            user.isBlocked ? 'user_blocked' : 'user_unblocked',
            `User ${user.isBlocked ? 'blocked' : 'unblocked'} by ${req.user.name}`,
            req.ip
        );

        res.status(200).json({
            success: true,
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            data: { isBlocked: user.isBlocked }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Reset user password
// @route   PUT /api/users/:id/reset-password
// @access  Private (Admin)
exports.resetPassword = async (req, res) => {
    try {
        const { newPassword } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.password = newPassword;
        await user.save();

        await user.addActivity('password_reset', `Password reset by ${req.user.name}`, req.ip);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user activity log
// @route   GET /api/users/:id/activity
// @access  Private (Admin)
exports.getUserActivity = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('activityLog name email');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                user: {
                    name: user.name,
                    email: user.email
                },
                activityLog: user.activityLog.sort((a, b) => b.timestamp - a.timestamp)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

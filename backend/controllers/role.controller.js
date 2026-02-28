const Role = require('../models/Role.model');
const User = require('../models/User.model');

// Default permission structure
const defaultPermission = {
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canPrint: false
};

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
exports.getAllRoles = async (req, res) => {
    try {
        const roles = await Role.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: roles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single role
// @route   GET /api/roles/:id
// @access  Private
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        res.status(200).json({
            success: true,
            data: role
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private (Admin)
exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions, dataScope } = req.body;

        // Check if role already exists
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'Role with this name already exists'
            });
        }

        // Create role with default permissions if not provided
        const role = await Role.create({
            name,
            description,
            permissions: permissions || {
                dashboard: { ...defaultPermission },
                booking: { ...defaultPermission },
                tracking: { ...defaultPermission },
                invoicing: { ...defaultPermission },
                shipper: { ...defaultPermission },
                users: { ...defaultPermission },
                roles: { ...defaultPermission },
                reports: { ...defaultPermission },
                complaints: { ...defaultPermission },
                api: { ...defaultPermission },
                payments: { ...defaultPermission },
                settings: { ...defaultPermission }
            },
            dataScope: dataScope || 'own',
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Role created successfully',
            data: role
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (Admin)
exports.updateRole = async (req, res) => {
    try {
        const { name, description, permissions, dataScope } = req.body;

        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Prevent editing system roles
        if (role.isSystemRole) {
            return res.status(400).json({
                success: false,
                message: 'System roles cannot be modified'
            });
        }

        // Update fields
        if (name) role.name = name;
        if (description !== undefined) role.description = description;
        if (permissions) role.permissions = permissions;
        if (dataScope) role.dataScope = dataScope;

        await role.save();

        res.status(200).json({
            success: true,
            message: 'Role updated successfully',
            data: role
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (Admin)
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({
                success: false,
                message: 'Role not found'
            });
        }

        // Prevent deleting system roles
        if (role.isSystemRole) {
            return res.status(400).json({
                success: false,
                message: 'System roles cannot be deleted'
            });
        }

        // Check if any users are assigned this role
        const usersWithRole = await User.countDocuments({ role: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
            });
        }

        await role.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Role deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Duplicate role
// @route   POST /api/roles/:id/duplicate
// @access  Private (Admin)
exports.duplicateRole = async (req, res) => {
    try {
        const { newName } = req.body;

        const sourceRole = await Role.findById(req.params.id);

        if (!sourceRole) {
            return res.status(404).json({
                success: false,
                message: 'Source role not found'
            });
        }

        // Check if new name already exists
        const existingRole = await Role.findOne({ name: newName });
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: 'A role with this name already exists'
            });
        }

        // Create duplicate
        const newRole = await Role.create({
            name: newName,
            description: `Copy of ${sourceRole.name}`,
            permissions: sourceRole.permissions,
            dataScope: sourceRole.dataScope,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Role duplicated successfully',
            data: newRole
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Initialize default system roles
// @route   POST /api/roles/init-defaults
// @access  Private (Super Admin only)
exports.initializeDefaultRoles = async (req, res) => {
    try {
        const defaultRoles = [
            {
                name: 'Super Admin',
                description: 'Full access to all modules and settings',
                isSystemRole: true,
                dataScope: 'all',
                permissions: {
                    dashboard: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    booking: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    tracking: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    invoicing: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    shipper: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    users: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    roles: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    reports: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    complaints: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    api: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    payments: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    settings: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true }
                }
            },
            {
                name: 'Admin',
                description: 'Full operational access, excluding system configuration',
                isSystemRole: true,
                dataScope: 'all',
                permissions: {
                    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true, canPrint: true },
                    booking: { canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    tracking: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    invoicing: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    shipper: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    users: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    roles: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true, canPrint: true },
                    complaints: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    api: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    payments: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    settings: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false }
                }
            },
            {
                name: 'Operations Manager',
                description: 'Access to bookings, tracking, and shipper management',
                isSystemRole: true,
                dataScope: 'branch',
                permissions: {
                    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    booking: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    tracking: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    invoicing: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: true, canPrint: true },
                    shipper: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: true, canPrint: true },
                    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    reports: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true, canPrint: true },
                    complaints: { canView: true, canAdd: true, canEdit: true, canDelete: false, canExport: false, canPrint: false },
                    api: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    payments: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: true, canPrint: true },
                    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false }
                }
            },
            {
                name: 'Agent',
                description: 'Limited access to booking creation and consignment tracking',
                isSystemRole: true,
                dataScope: 'own',
                permissions: {
                    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    booking: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false, canPrint: true },
                    tracking: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    invoicing: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: true },
                    shipper: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    reports: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    complaints: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    api: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    payments: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false }
                }
            },
            {
                name: 'Shipper',
                description: 'Access to own bookings, tracking, and invoices only',
                isSystemRole: true,
                dataScope: 'own',
                permissions: {
                    dashboard: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    booking: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false, canPrint: true },
                    tracking: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    invoicing: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: true },
                    shipper: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    users: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    roles: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    reports: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    complaints: { canView: true, canAdd: true, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    api: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    payments: { canView: true, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false },
                    settings: { canView: false, canAdd: false, canEdit: false, canDelete: false, canExport: false, canPrint: false }
                }
            }
        ];

        // Insert roles that don't exist
        const createdRoles = [];
        for (const roleData of defaultRoles) {
            const existing = await Role.findOne({ name: roleData.name });
            if (!existing) {
                const role = await Role.create(roleData);
                createdRoles.push(role);
            }
        }

        res.status(201).json({
            success: true,
            message: `${createdRoles.length} default roles initialized`,
            data: createdRoles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

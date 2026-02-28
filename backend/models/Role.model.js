const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    module: {
        type: String,
        required: true
    },
    canView: {
        type: Boolean,
        default: false
    },
    canAdd: {
        type: Boolean,
        default: false
    },
    canEdit: {
        type: Boolean,
        default: false
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    canExport: {
        type: Boolean,
        default: false
    },
    canPrint: {
        type: Boolean,
        default: false
    }
}, { _id: false });

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Role name is required'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isSystemRole: {
        type: Boolean,
        default: false
    },
    permissions: {
        dashboard: permissionSchema,
        booking: permissionSchema,
        tracking: permissionSchema,
        invoicing: permissionSchema,
        shipper: permissionSchema,
        users: permissionSchema,
        roles: permissionSchema,
        reports: permissionSchema,
        complaints: permissionSchema,
        api: permissionSchema,
        payments: permissionSchema,
        settings: permissionSchema
    },
    dataScope: {
        type: String,
        enum: ['all', 'branch', 'zone', 'own'],
        default: 'own'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('./models/Role.model');
const User = require('./models/User.model');

// Load environment variables
dotenv.config();

const seedAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');

        // Check if Super Admin role exists
        let superAdminRole = await Role.findOne({ name: 'Super Admin' });

        if (!superAdminRole) {
            console.log('Creating Super Admin role...');
            superAdminRole = await Role.create({
                name: 'Super Admin',
                description: 'Full system access with all permissions',
                permissions: {
                    dashboard: { module: 'Dashboard', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    booking: { module: 'Booking', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    tracking: { module: 'Tracking', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    invoicing: { module: 'Invoicing', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    shipper: { module: 'Shipper', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    users: { module: 'Users', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    roles: { module: 'Roles', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    reports: { module: 'Reports', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    complaints: { module: 'Complaints', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    api: { module: 'API', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    payments: { module: 'Payments', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true },
                    settings: { module: 'Settings', canView: true, canAdd: true, canEdit: true, canDelete: true, canExport: true, canPrint: true }
                },
                dataScope: 'all',
                isSystemRole: true
            });
            console.log('✅ Super Admin role created');
        } else {
            console.log('✅ Super Admin role already exists');
        }

        // Check if admin user exists
        const existingAdmin = await User.findOne({ email: 'admin@thermovex.com' });

        if (existingAdmin) {
            console.log('❌ Admin user already exists with email: admin@thermovex.com');
            console.log('Use these credentials to login:');
            console.log('Email: admin@thermovex.com');
            console.log('Password: (the password you previously set)');
        } else {
            console.log('Creating admin user...');
            const adminUser = await User.create({
                name: 'Admin User',
                email: 'admin@thermovex.com',
                mobile: '1234567890',
                password: 'admin123',
                role: superAdminRole._id,
                isActive: true,
                isBlocked: false
            });
            console.log('✅ Admin user created successfully!');
            console.log('\n===========================================');
            console.log('Login Credentials:');
            console.log('Email: admin@thermovex.com');
            console.log('Password: admin123');
            console.log('===========================================\n');
        }

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedAdminUser();

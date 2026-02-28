const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shipper = require('./models/Shipper.model');

// Load environment variables
dotenv.config();

const sampleShippers = [
    {
        name: 'Rajesh Kumar',
        company: 'ABC Electronics',
        email: 'rajesh@abcelectronics.com',
        mobile: '9876543210',
        phone: '022-12345678',
        address: {
            street: '123 MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            postalCode: '400001',
            country: 'India'
        },
        gstNumber: '27AAAAA0000A1Z5',
        panNumber: 'AAAAA0000A',
        paymentType: 'Credit',
        creditLimit: 100000,
        creditDays: 30,
        status: 'Active'
    },
    {
        name: 'Priya Sharma',
        company: 'XYZ Textiles',
        email: 'priya@xyztextiles.com',
        mobile: '9876543211',
        phone: '011-23456789',
        address: {
            street: '456 Nehru Place',
            city: 'Delhi',
            state: 'Delhi',
            postalCode: '110019',
            country: 'India'
        },
        gstNumber: '07BBBBB0000B1Z5',
        panNumber: 'BBBBB0000B',
        paymentType: 'Prepaid',
        status: 'Active'
    },
    {
        name: 'Amit Patel',
        company: 'Global Pharma Ltd',
        email: 'amit@globalpharma.com',
        mobile: '9876543212',
        phone: '079-34567890',
        address: {
            street: '789 SG Highway',
            city: 'Ahmedabad',
            state: 'Gujarat',
            postalCode: '380015',
            country: 'India'
        },
        gstNumber: '24CCCCC0000C1Z5',
        panNumber: 'CCCCC0000C',
        paymentType: 'Credit',
        creditLimit: 200000,
        creditDays: 45,
        status: 'Active'
    }
];

const seedShippers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');

        // Check if shippers already exist
        const existingCount = await Shipper.countDocuments();

        if (existingCount > 0) {
            console.log(`❌ Database already has ${existingCount} shippers`);
            console.log('Skipping seed to prevent duplicates');
        } else {
            console.log('Creating sample shippers...');
            await Shipper.insertMany(sampleShippers);
            console.log('✅ Sample shippers created successfully!');
            console.log(`\nCreated ${sampleShippers.length} shippers:`);
            sampleShippers.forEach((s, i) => {
                console.log(`${i + 1}. ${s.company} - ${s.name} (${s.email})`);
            });
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedShippers();

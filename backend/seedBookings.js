const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Shipper = require('./models/Shipper.model');
const Booking = require('./models/Booking.model');
const User = require('./models/User.model');

// Load environment variables
dotenv.config();

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');

        // Get admin user
        const adminUser = await User.findOne({ email: 'admin@thermovex.com' });
        if (!adminUser) {
            console.log('❌ Admin user not found. Please run seedAdmin.js first');
            process.exit(1);
        }
        console.log('✅ Found admin user');

        // Create or get shipper
        let shipper = await Shipper.findOne({ email: 'rajesh@abcelectronics.com' });

        if (!shipper) {
            console.log('Creating sample shipper...');
            shipper = await Shipper.create({
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
            });
            console.log('✅ Shipper created:', shipper.company);
        } else {
            console.log('✅ Shipper already exists:', shipper.company);
        }

        // Check if bookings already exist
        const existingBookingsCount = await Booking.countDocuments({ shipper: shipper._id });

        if (existingBookingsCount > 0) {
            console.log(`✅ ${existingBookingsCount} bookings already exist for this shipper`);
            console.log('Delete existing bookings if you want to reseed: db.bookings.deleteMany({ shipper: ObjectId("...") })');
        } else {
            console.log('Creating sample bookings...');

            const sampleBookings = [
                {
                    shipper: shipper._id,
                    bookedBy: adminUser._id,
                    serviceType: 'Express',
                    destinationType: 'Domestic',
                    paymentMode: 'Prepaid',
                    status: 'Delivered',
                    weight: 2.5,
                    numberOfPieces: 1,
                    description: 'Electronics - Mobile Phone',
                    declaredValue: 15000,
                    consigneeDetails: {
                        name: 'Amit Shah',
                        mobile: '9876543211',
                        email: 'amit@example.com',
                        address: {
                            street: '456 Park Street',
                            city: 'Delhi',
                            state: 'Delhi',
                            postalCode: '110001',
                            country: 'India'
                        }
                    },
                    dimensions: {
                        length: 30,
                        width: 20,
                        height: 10,
                        unit: 'cm'
                    },
                    shippingCharges: 250,
                    insuranceCharges: 150,
                    fuelSurcharge: 25,
                    gstAmount: 76.5,
                    totalAmount: 501.5,
                    bookingDate: new Date('2026-02-01'),
                    deliveredDate: new Date('2026-02-15')
                },
                {
                    shipper: shipper._id,
                    bookedBy: adminUser._id,
                    serviceType: 'Standard',
                    destinationType: 'Domestic',
                    paymentMode: 'COD',
                    codAmount: 5000,
                    status: 'Delivered',
                    weight: 5,
                    numberOfPieces: 2,
                    description: 'Books and Stationery',
                    declaredValue: 5000,
                    consigneeDetails: {
                        name: 'Priya Sharma',
                        mobile: '9876543212',
                        address: {
                            street: '789 MG Road',
                            city: 'Bangalore',
                            state: 'Karnataka',
                            postalCode: '560001',
                            country: 'India'
                        }
                    },
                    dimensions: {
                        length: 40,
                        width: 30,
                        height: 20,
                        unit: 'cm'
                    },
                    shippingCharges: 300,
                    codCharges: 100,
                    fuelSurcharge: 30,
                    gstAmount: 77.4,
                    totalAmount: 507.4,
                    bookingDate: new Date('2026-02-05'),
                    deliveredDate: new Date('2026-02-18')
                },
                {
                    shipper: shipper._id,
                    bookedBy: adminUser._id,
                    serviceType: 'Express',
                    destinationType: 'Domestic',
                    paymentMode: 'Prepaid',
                    status: 'Delivered',
                    weight: 1.5,
                    numberOfPieces: 1,
                    description: 'Documents',
                    declaredValue: 1000,
                    consigneeDetails: {
                        name: 'Suresh Patel',
                        mobile: '9876543213',
                        address: {
                            street: '321 Station Road',
                            city: 'Ahmedabad',
                            state: 'Gujarat',
                            postalCode: '380001',
                            country: 'India'
                        }
                    },
                    dimensions: {
                        length: 25,
                        width: 15,
                        height: 5,
                        unit: 'cm'
                    },
                    shippingCharges: 180,
                    insuranceCharges: 10,
                    fuelSurcharge: 18,
                    gstAmount: 37.44,
                    totalAmount: 245.44,
                    bookingDate: new Date('2026-02-10'),
                    deliveredDate: new Date('2026-02-20')
                },
                {
                    shipper: shipper._id,
                    bookedBy: adminUser._id,
                    serviceType: 'Economy',
                    destinationType: 'Domestic',
                    paymentMode: 'Prepaid',
                    status: 'Delivered',
                    weight: 10,
                    numberOfPieces: 3,
                    description: 'Textile Products',
                    declaredValue: 8000,
                    consigneeDetails: {
                        name: 'Meena Reddy',
                        mobile: '9876543214',
                        address: {
                            street: '654 Temple Street',
                            city: 'Chennai',
                            state: 'Tamil Nadu',
                            postalCode: '600001',
                            country: 'India'
                        }
                    },
                    dimensions: {
                        length: 50,
                        width: 40,
                        height: 30,
                        unit: 'cm'
                    },
                    shippingCharges: 400,
                    insuranceCharges: 80,
                    fuelSurcharge: 40,
                    gstAmount: 93.6,
                    totalAmount: 613.6,
                    bookingDate: new Date('2026-02-12'),
                    deliveredDate: new Date('2026-02-22')
                }
            ];

            // Create bookings one by one to allow AWB generation
            for (const bookingData of sampleBookings) {
                await Booking.create(bookingData);
            }
            console.log(`✅ Created ${sampleBookings.length} sample bookings`);

            console.log('\nBooking Summary:');
            sampleBookings.forEach((b, i) => {
                console.log(`${i + 1}. ${b.consigneeDetails.name} - ${b.serviceType} - ₹${b.totalAmount} - ${b.status}`);
            });
        }

        console.log('\n✅ Seed completed successfully!');
        console.log('You can now create invoices for delivered bookings.');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

seedData();

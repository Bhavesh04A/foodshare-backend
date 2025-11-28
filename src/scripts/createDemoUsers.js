import mongoose from 'mongoose';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const demoUsers = [{
        name: 'Demo Restaurant',
        email: 'demo_restaurant@foodshare.com',
        password: 'demo123',
        role: 'restaurant',
        pinCode: '400001',
        zone: 'A',
        verified: true
    },
    {
        name: 'Demo NGO',
        email: 'demo_ngo@foodshare.com',
        password: 'demo123',
        role: 'ngo',
        pinCode: '400002',
        zone: 'B',
        verified: true
    },
    {
        name: 'Demo Volunteer',
        email: 'demo_volunteer@foodshare.com',
        password: 'demo123',
        role: 'volunteer',
        pinCode: '400003',
        zone: 'C',
        verified: true
    }
];

const createDemoUsers = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/foodshare');
        console.log('Connected to MongoDB');

        // Delete existing demo users
        await User.deleteMany({
            email: { $in: demoUsers.map(user => user.email) }
        });
        console.log('Cleaned up existing demo users');

        // Create new demo users
        for (const userData of demoUsers) {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            await user.save();
            console.log(`Created demo user: ${userData.email}`);
        }

        console.log('Demo users created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error creating demo users:', error);
        process.exit(1);
    }
};

createDemoUsers();
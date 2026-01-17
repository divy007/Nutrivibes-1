
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import User from '../src/models/User';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const DIETICIAN_CREDENTIALS = {
    email: 'mansianajwala2000@gmail.com',
    password: 'mansi2001',
    name: 'Mansi Anajwala',
    role: 'DIETICIAN' as const,
    loginMethod: 'EMAIL_PASSWORD' as const
};

async function addDietician() {
    try {
        await mongoose.connect(MONGODB_URI as string, {
            dbName: 'diet_planner'
        });
        console.log('Connected to MongoDB');
        console.log('Database Name:', mongoose.connection.name);

        const existingUser = await User.findOne({ email: DIETICIAN_CREDENTIALS.email });

        if (existingUser) {
            console.log('User already exists in diet_planner:', existingUser.email);
            // Optional: Update password if needed
            existingUser.password = DIETICIAN_CREDENTIALS.password;
            await existingUser.save();
            console.log('Password updated for existing user in diet_planner.');
        } else {
            const newUser = await User.create(DIETICIAN_CREDENTIALS);
            console.log('Dietician created successfully in diet_planner:', newUser.email);
        }

    } catch (error) {
        console.error('Error adding dietician:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

addDietician();

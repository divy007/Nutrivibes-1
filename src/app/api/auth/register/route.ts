import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Client from '@/models/Client';
import { generateToken } from '@/lib/auth';

const registerSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
    phone: z.string().min(10, { message: 'Valid phone number is required' }),
});

export async function POST(req: Request) {
    try {
        await connectDB();

        const body = await req.json();

        // Validate request body
        const validationResult = registerSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validationResult.error.issues[0].message,
                },
                { status: 400 }
            );
        }

        const { name, email, password, phone } = validationResult.data;

        // Check if user already exists by email or by phone
        const existingUserByEmail = await User.findOne({ email: email.toLowerCase() });
        const existingUserByPhone = phone ? await User.findOne({ phone }) : null;

        let user;
        let client;

        // Check if phone matches an existing placeholder user created from a referral lead
        if (existingUserByPhone && existingUserByPhone.email?.endsWith('@referral.placeholder')) {
            // Check if the input email matches another user that is NOT this placeholder
            if (existingUserByEmail && existingUserByEmail._id.toString() !== existingUserByPhone._id.toString()) {
                return NextResponse.json(
                    { success: false, message: 'This email is already registered. Please sign in instead.' },
                    { status: 400 }
                );
            }

            // Update placeholder user
            existingUserByPhone.name = name;
            existingUserByPhone.email = email.toLowerCase();
            existingUserByPhone.password = password; // Hashed in pre-save hook
            await existingUserByPhone.save();

            user = existingUserByPhone;

            // Update placeholder Client profile
            const existingClient = await Client.findOne({ userId: user._id });
            if (existingClient) {
                existingClient.name = name;
                existingClient.email = email.toLowerCase();
                existingClient.phone = phone;
                existingClient.status = 'LEAD';
                existingClient.isProfileComplete = false;
                await existingClient.save();
                client = existingClient;
            } else {
                const dietician = await User.findOne({ role: 'DIETICIAN' }).sort({ createdAt: 1 });
                if (!dietician) {
                    throw new Error('System configuration error: No dietician available');
                }
                client = await Client.create({
                    name,
                    email: email.toLowerCase(),
                    phone,
                    userId: user._id,
                    dieticianId: dietician._id,
                    registrationSource: 'MOBILE_APP',
                    status: 'LEAD',
                    isProfileComplete: false,
                });
            }
        } else if (existingUserByEmail || existingUserByPhone) {
            const isEmailDup = !!existingUserByEmail;
            return NextResponse.json(
                { 
                    success: false, 
                    message: isEmailDup 
                        ? 'This email is already registered. Please sign in instead.' 
                        : 'An account with this phone number already exists.' 
                },
                { status: 400 }
            );
        } else {
            // Normal creation
            user = await User.create({
                name,
                email: email.toLowerCase(),
                password,
                phone,
                role: 'CLIENT',
                loginMethod: 'EMAIL_PASSWORD',
            });

            const dietician = await User.findOne({ role: 'DIETICIAN' }).sort({ createdAt: 1 });
            if (!dietician) {
                console.error('No dietician found in system for lead assignment');
                throw new Error('System configuration error: No dietician available');
            }

            client = await Client.create({
                name,
                email: email.toLowerCase(),
                phone,
                userId: user._id,
                dieticianId: dietician._id,
                registrationSource: 'MOBILE_APP',
                status: 'LEAD',
                isProfileComplete: false,
            });
        }

        // Generate token
        const token = generateToken(user, false);

        return NextResponse.json({
            success: true,
            message: 'Registration successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isProfileComplete: false
            },
            token,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Registration error:', error);

        // Handle MongoDB Duplicate Key Error
        if (error.code === 11000) {
            return NextResponse.json(
                { success: false, message: 'An account with this email or phone already exists.' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

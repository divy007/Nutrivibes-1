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

        const { name, email, password } = validationResult.data;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: 'This email is already registered. Please sign in instead.' },
                { status: 400 }
            );
        }

        // 1. Create User
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: 'CLIENT',
            loginMethod: 'EMAIL_PASSWORD',
        });

        // Find the first dietician to assign as the primary contact for the lead
        const dietician = await User.findOne({ role: 'DIETICIAN' }).sort({ createdAt: 1 });
        if (!dietician) {
            console.error('No dietician found in system for lead assignment');
            throw new Error('System configuration error: No dietician available');
        }

        // 2. Create Client Profile as a LEAD
        const client = await Client.create({
            name,
            email: email.toLowerCase(),
            userId: user._id,
            dieticianId: dietician._id, // Assign to the first dietician
            registrationSource: 'MOBILE_APP',
            status: 'LEAD',
            isProfileComplete: false,
        });

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

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

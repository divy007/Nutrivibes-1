import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Client from '@/models/Client';
import { generateToken } from '@/lib/auth';

const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export async function POST(req: Request) {
    console.log('POST /api/auth/login hit');
    try {
        await connectDB();

        const body = await req.json();

        // Validate request body
        const validationResult = loginSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: validationResult.error.issues[0].message,
                },
                { status: 400 }
            );
        }

        const { email, password } = validationResult.data;

        // Find user (case-insensitive)
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address or password' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address or password' },
                { status: 401 }
            );
        }

        let isProfileComplete = false;
        if (user.role === 'CLIENT') {
            const client = await Client.findOne({ userId: user._id });
            isProfileComplete = client?.isProfileComplete || false;
        }

        // Generate token
        const token = generateToken(user, isProfileComplete);

        // Remove password from response
        const userResponse = user.toJSON();

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            user: { ...userResponse, isProfileComplete },
            token,
        });

        // Set HTTP-only cookie for middleware
        // Set HTTP-only cookie for middleware with namespacing
        const cookieName = user.role === 'DIETICIAN' ? 'token_dietician' : 'token_client';

        response.cookies.set(cookieName, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

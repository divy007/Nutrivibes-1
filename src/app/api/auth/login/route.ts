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
    const start = Date.now();
    console.log('--- LOGIN REQUEST RECEIVED ---');

    try {
        await connectDB();
        console.log(`[LOGIN DEBUG] DB Connected in ${Date.now() - start}ms`);

        const body = await req.json();
        console.log(`[LOGIN DEBUG] Body parsed in ${Date.now() - start}ms`);

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
        console.log(`[LOGIN DEBUG] User found in ${Date.now() - start}ms`);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address or password' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        console.log(`[LOGIN DEBUG] Password checked in ${Date.now() - start}ms`);

        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid email address or password' },
                { status: 401 }
            );
        }

        let isProfileComplete = false;
        if (user.role === 'CLIENT') {
            const client = await Client.findOne({ userId: user._id });
            console.log(`[LOGIN DEBUG] Client profile found in ${Date.now() - start}ms`);
            isProfileComplete = client?.isProfileComplete || false;
        }

        // Generate token
        const token = generateToken(user, isProfileComplete);
        console.log(`[LOGIN DEBUG] Token generated in ${Date.now() - start}ms`);

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

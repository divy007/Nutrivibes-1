import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken } from '@/lib/auth';

const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export async function POST(req: Request) {
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
                { success: false, message: 'Invalid Username or Password' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: 'Invalid Username or Password' },
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken(user);

        // Remove password from response
        const userResponse = user.toJSON();

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: userResponse,
            token,
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Server error' },
            { status: 500 }
        );
    }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let isProfileComplete = false;
        if (user.role === 'CLIENT') {
            const client = await Client.findOne({ userId: user._id });
            isProfileComplete = client?.isProfileComplete || false;
        } else {
            isProfileComplete = true; // Dieticians do not require complete-profile step
        }

        // Return user details at root level to match client-side expectations
        return NextResponse.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isProfileComplete,
        });
    } catch (error: any) {
        console.error('Failed to fetch current user auth:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

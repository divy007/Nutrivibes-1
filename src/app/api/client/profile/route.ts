import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        await connectDB();
        const user = await getAuthUser(req);

        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findOne({ userId: user._id });

        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Failed to fetch profile:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const user = await getAuthUser(req);

        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { city, state, dob, gender, height, weight } = body;

        // Basic validation
        if (!city || !state || !dob || !gender || !height || !weight) {
            // Allow partial updates if needed, but for "completion" we might want to check all
        }

        const updateData = {
            ...body,
            // Automatically mark profile as complete if all required fields are present
            isProfileComplete: !!(city && state && dob && gender && height && weight)
        };

        const client = await Client.findOneAndUpdate(
            { userId: user._id },
            { $set: updateData },
            { new: true }
        );

        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Failed to update profile:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

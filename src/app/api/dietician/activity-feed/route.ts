import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { getAuthUser } from '@/lib/auth';
import Client from '@/models/Client';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ensure Client model is registered (prevent tree-shaking)
        const _ = Client;

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Fetch paginated activities
        const activities = await ActivityLog.find({ dieticianId: user._id })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('clientId', 'name imageUrl') // specific fields from Client
            .lean();

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Failed to fetch activity feed:', error);
        return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
    }
}

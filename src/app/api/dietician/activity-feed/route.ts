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

        // Fetch latest 20 activities for this dietician's clients
        const activities = await ActivityLog.find({ dieticianId: user._id })
            .sort({ timestamp: -1 })
            .limit(20)
            .populate('clientId', 'name imageUrl') // specific fields from Client
            .lean();

        return NextResponse.json(activities);
    } catch (error) {
        console.error('Failed to fetch activity feed:', error);
        return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
    }
}

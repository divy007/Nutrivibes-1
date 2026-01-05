import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import WeightLog from '@/models/WeightLog';
import { getAuthUser } from '@/lib/auth';
import Client from '@/models/Client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify that the user has permission to view this client's data
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (user.role === 'DIETICIAN' && client.dieticianId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const logs = await WeightLog.find({ clientId: id }).sort({ date: -1 }).lean();
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch weight logs for dietician:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

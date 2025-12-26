import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import { subDays } from 'date-fns';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dieticianId = user._id;

        // 1. Active Clients
        const activeCount = await Client.countDocuments({
            dieticianId,
            status: 'ACTIVE'
        });

        // 2. Paused/Inactive Clients
        const pausedCount = await Client.countDocuments({
            dieticianId,
            status: 'INACTIVE'
        });

        // 3. New Clients (Last 15 days)
        const fifteenDaysAgo = subDays(new Date(), 15);
        const newCount = await Client.countDocuments({
            dieticianId,
            createdAt: { $gte: fifteenDaysAgo }
        });

        // 4. Expired Clients (Mocking for now as it's not in the model)
        const expiredCount = 0;

        return NextResponse.json({
            activeClients: activeCount,
            newClients: newCount,
            pausedClients: pausedCount,
            expiredClients: expiredCount
        });
    } catch (error) {
        console.error('Failed to fetch dietician stats:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}

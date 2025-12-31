import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay } from 'date-fns';

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

        // 2. Paused Clients
        const pausedCount = await Client.countDocuments({
            dieticianId,
            status: 'PAUSED'
        });

        // 3. New Clients (Last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7);
        const newCount = await Client.countDocuments({
            dieticianId,
            createdAt: { $gte: sevenDaysAgo }
        });

        // 4. Expired Clients (Soft Deleted)
        const expiredCount = await Client.countDocuments({
            dieticianId,
            status: 'DELETED'
        });

        // 5. Today's Follow Up (from FollowUp collection, Pending status)
        const FollowUp = (await import('@/models/FollowUp')).default;
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const followUps = await FollowUp.find({
            dieticianId,
            status: 'Pending',
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).populate('clientId', 'name dietStatus');

        return NextResponse.json({
            activeClients: activeCount,
            newClients: newCount,
            pausedClients: pausedCount,
            expiredClients: expiredCount,
            todayFollowUps: followUps.map((fu: any) => ({
                name: fu.clientId?.name || 'Unknown Client',
                color: fu.clientId?.dietStatus ? (fu.clientId.dietStatus === 'green' ? 'bg-emerald-500' : fu.clientId.dietStatus === 'red' ? 'bg-rose-500' : 'bg-amber-500') : 'bg-slate-300'
            }))
        });
    } catch (error) {
        console.error('Failed to fetch dietician stats:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}

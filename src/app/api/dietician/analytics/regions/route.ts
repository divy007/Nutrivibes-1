import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const regions = await Client.aggregate([
            {
                $match: {
                    dieticianId: user._id,
                    status: { $ne: 'DELETED' },
                    pincode: { $exists: true, $ne: '' }
                }
            },
            {
                $group: {
                    _id: "$pincode",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    _id: 0,
                    pincode: "$_id",
                    count: 1
                }
            }
        ]);

        return NextResponse.json(regions);

    } catch (error) {
        console.error('Error fetching region analytics:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

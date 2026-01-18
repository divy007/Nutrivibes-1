import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'dietician') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const regions = await Client.aggregate([
            {
                $match: {
                    dieticianId: session.user.id,
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

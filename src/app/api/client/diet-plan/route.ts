import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import Client from '@/models/Client';
import { format } from 'date-fns';
import { verifyToken } from '@/lib/auth';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function GET(req: Request) {
    await dbConnect();

    try {
        // Extract and verify token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized - Client access only' }, { status: 403 });
        }

        const userId = decoded.userId;

        // Find the Client profile associated with this User
        const client = await Client.findOne({ userId: userId });

        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const url = new URL(req.url);
        const startDate = url.searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');

        // Fetch diet plan using the actual Client ID
        const dietPlan = await DietPlan.findOne({
            clientId: client._id,
            weekStartDate: normalizeDateUTC(startDate)
        });

        if (!dietPlan) {
            return NextResponse.json({
                success: true,
                message: 'No plan found',
                data: null
            });
        }

        // Filter to only return PUBLISHED days
        const filteredDays = dietPlan.days.map((day: any) => ({
            ...day.toObject(),
            meals: day.status === 'PUBLISHED' ? day.meals : [],
            status: day.status === 'PUBLISHED' ? 'PUBLISHED' : 'NO_DIET'
        }));

        const response = {
            ...dietPlan.toObject(),
            days: filteredDays
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Failed to fetch client diet plan:', error);
        return NextResponse.json({ error: 'Failed to fetch diet plan' }, { status: 500 });
    }
}

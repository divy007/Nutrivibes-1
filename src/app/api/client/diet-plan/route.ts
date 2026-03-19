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
        const targetDate = normalizeDateUTC(startDate);

        // 1. Fetch diet plan using the exact requested week start date
        let dietPlan = await DietPlan.findOne({
            clientId: client._id,
            weekStartDate: targetDate
        });

        // 2. Fallback: If the dietician changed the diet start date, the anchor day shifts.
        // The requested week start date might exist inside an older plan's saved days.
        if (!dietPlan) {
            dietPlan = await DietPlan.findOne({
                clientId: client._id,
                'days.date': targetDate
            });
        }

        // 3. Fallback: Check for legacy plans saved with a Monday start
        if (!dietPlan) {
            const { startOfWeek } = await import('date-fns');
            const mondayStart = format(startOfWeek(new Date(startDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (mondayStart !== startDate) {
                dietPlan = await DietPlan.findOne({
                    clientId: client._id,
                    weekStartDate: normalizeDateUTC(mondayStart)
                });
            }
        }

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

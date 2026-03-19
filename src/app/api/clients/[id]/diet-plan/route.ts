import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import { startOfWeek, format } from 'date-fns';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    // A01: Broken Access Control Fix
    const { getAuthUser } = await import('@/lib/auth');
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const Client = (await import('@/models/Client')).default;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    if (user.role === 'CLIENT' && client.userId?.toString() !== user._id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else if (user.role !== 'DIETICIAN' && user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');

    try {
        const targetDate = normalizeDateUTC(startDate);
        
        // 1. Exact match for weekStartDate
        let dietPlan = await DietPlan.findOne({
            clientId: id,
            weekStartDate: targetDate
        });

        // 2. Containment match for shifted dietStartDate
        if (!dietPlan) {
            dietPlan = await DietPlan.findOne({
                clientId: id,
                'days.date': targetDate
            });
        }

        // 3. Fallback to Monday map
        if (!dietPlan) {
            const mondayStart = format(startOfWeek(new Date(startDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (mondayStart !== startDate) {
                dietPlan = await DietPlan.findOne({
                    clientId: id,
                    weekStartDate: normalizeDateUTC(mondayStart)
                });
            }
        }

        return NextResponse.json(dietPlan || { success: true, message: 'No plan found' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch diet plan' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    try {
        const { weekStartDate, days } = body;

        // Normalize all dates in the days array to UTC to prevent timezone issues
        const normalizedDays = days.map((day: any) => ({
            ...day,
            date: normalizeDateUTC(day.date)
        }));

        const dietPlan = await DietPlan.findOneAndUpdate(
            { clientId: id, weekStartDate: normalizeDateUTC(weekStartDate) },
            {
                clientId: id,
                weekStartDate: normalizeDateUTC(weekStartDate),
                days: normalizedDays
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(dietPlan);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save diet plan' }, { status: 500 });
    }
}

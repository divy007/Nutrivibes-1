import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import { startOfWeek, format } from 'date-fns';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');

    try {
        const dietPlan = await DietPlan.findOne({
            clientId: id,
            weekStartDate: normalizeDateUTC(startDate)
        });

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
        console.error('Save diet plan error:', error);
        return NextResponse.json({ error: 'Failed to save diet plan' }, { status: 500 });
    }
}

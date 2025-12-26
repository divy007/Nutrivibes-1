import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import { startOfWeek, format } from 'date-fns';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');

    try {
        const dietPlan = await DietPlan.findOne({
            clientId: id,
            weekStartDate: { $gte: new Date(startDate) }
        }).populate('days.meals.items.foodId');

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

        const dietPlan = await DietPlan.findOneAndUpdate(
            { clientId: id, weekStartDate: new Date(weekStartDate) },
            { clientId: id, weekStartDate: new Date(weekStartDate), days },
            { upsert: true, new: true }
        );

        return NextResponse.json(dietPlan);
    } catch (error) {
        console.error('Save diet plan error:', error);
        return NextResponse.json({ error: 'Failed to save diet plan' }, { status: 500 });
    }
}

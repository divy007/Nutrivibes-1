import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import MealLog from '@/models/MealLog';
import { getAuthUser } from '@/lib/auth';
import { startOfDay } from 'date-fns';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findOne({ userId: user._id });
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get('date');
        const queryDate = dateParam ? startOfDay(new Date(dateParam)) : startOfDay(new Date());

        const logs = await MealLog.find({
            clientId: client._id,
            date: queryDate
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch meal logs:', error);
        return NextResponse.json({ error: 'Failed to fetch meal logs' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findOne({ userId: user._id });
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const { date, category, items } = await req.json();

        if (!category || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid meal data' }, { status: 400 });
        }

        const queryDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());

        // Update if exists for this category and date, else create
        const log = await MealLog.findOneAndUpdate(
            { clientId: client._id, date: queryDate, category },
            { $set: { items } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json(log);
    } catch (error) {
        console.error('Failed to save meal log:', error);
        return NextResponse.json({ error: 'Failed to save meal log' }, { status: 500 });
    }
}

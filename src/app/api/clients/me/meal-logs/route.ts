import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import MealLog from '@/models/MealLog';
import { getAuthUser } from '@/lib/auth';
import { normalizeDateUTC } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

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
        const queryDate = normalizeDateUTC(dateParam || undefined);

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

        const { date, category, items, ...stats } = await req.json();

        if (!category || !items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid meal data' }, { status: 400 });
        }

        const queryDate = normalizeDateUTC(date || undefined);

        // Update if exists for this category and date, else create
        const log = await MealLog.findOneAndUpdate(
            { clientId: client._id, date: queryDate, category },
            {
                $set: {
                    items,
                    // DateWithDiet Fields - only update if provided
                    ...(stats.hungerLevel && { hungerLevel: stats.hungerLevel }),
                    ...(stats.satisfactionLevel && { satisfactionLevel: stats.satisfactionLevel }),
                    ...(stats.emotionalState && { emotionalState: stats.emotionalState }),
                    ...(stats.isTreat !== undefined && { isTreat: stats.isTreat }),
                    ...(stats.chewCount && { chewCount: stats.chewCount })
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json(log);
    } catch (error) {
        console.error('Failed to save meal log:', error);
        return NextResponse.json({ error: 'Failed to save meal log' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WaterIntake from '@/models/WaterIntake';
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

        const today = startOfDay(new Date());

        let intake = await WaterIntake.findOne({
            clientId: client._id,
            date: today
        });

        if (!intake) {
            // Create a new record for today if it doesn't exist
            intake = await WaterIntake.create({
                clientId: client._id,
                date: today,
                currentGlasses: 0,
                targetGlasses: 8
            });
        }

        return NextResponse.json(intake);
    } catch (error) {
        console.error('Failed to fetch water intake:', error);
        return NextResponse.json({ error: 'Failed to fetch water intake' }, { status: 500 });
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

        const { increment } = await req.json();
        const today = startOfDay(new Date());

        const intake = await WaterIntake.findOneAndUpdate(
            { clientId: client._id, date: today },
            { $inc: { currentGlasses: increment || 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json(intake);
    } catch (error) {
        console.error('Failed to update water intake:', error);
        return NextResponse.json({ error: 'Failed to update water intake' }, { status: 500 });
    }
}

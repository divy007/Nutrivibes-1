import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WeightLog from '@/models/WeightLog';
import { getAuthUser } from '@/lib/auth';
import { normalizeDateUTC } from '@/lib/date-utils';

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

        const logs = await WeightLog.find({ clientId: client._id }).sort({ date: -1 });
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch weight logs:', error);
        return NextResponse.json({ error: 'Failed to fetch weight logs' }, { status: 500 });
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

        const { weight, unit, date } = await req.json();

        if (!weight) {
            return NextResponse.json({ error: 'Weight is required' }, { status: 400 });
        }

        const normalizedDate = normalizeDateUTC(date || undefined);

        // UPSERT LOGIC: Update if exists for this day, otherwise create new
        // consistent with "last date will be the latest weight" requirement
        const newLog = await WeightLog.findOneAndUpdate(
            {
                clientId: client._id,
                date: normalizedDate
            },
            {
                $set: {
                    weight,
                    unit: unit || 'kg'
                }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // CLEANUP: If multiple logs existed for this day (legacy data), delete them.
        // This fixes the issue where an update might hit an older duplicate while a newer invalid duplicate remains visible.
        await WeightLog.deleteMany({
            clientId: client._id,
            date: normalizedDate,
            _id: { $ne: newLog._id }
        });

        // Also update the current weight in the client profile
        await Client.findByIdAndUpdate(client._id, { $set: { weight } });

        // Log functionality for Live Feed
        try {
            const { logActivity } = await import('@/lib/activity-utils');
            await logActivity(client._id.toString(), 'WEIGHT_LOG', `Client updated weight to ${weight} ${unit || 'kg'}`, `${weight}${unit || 'kg'}`);
        } catch (err) {
            console.error('Failed to log activity:', err);
        }

        return NextResponse.json(newLog, { status: 201 });
    } catch (error) {
        console.error('Failed to save weight log:', error);
        return NextResponse.json({ error: 'Failed to save weight log' }, { status: 500 });
    }
}

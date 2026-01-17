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

        const newLog = await WeightLog.create({
            clientId: client._id,
            weight,
            unit: unit || 'kg',
            date: normalizeDateUTC(date || undefined),
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

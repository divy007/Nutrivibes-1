import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WeightLog from '@/models/WeightLog';
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

        const logs = await WeightLog.find({ clientId: client._id }).sort({ date: -1 }).lean();
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

        // Date Range for "This Day" to catch logs with time components
        const startOfDay = new Date(normalizedDate);
        const endOfDay = new Date(normalizedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Find ANY log for this day
        let existingLog = await WeightLog.findOne({
            clientId: client._id,
            date: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        let savedLog;

        if (existingLog) {
            // Update existing log and force normalize the date to cleanup time component
            existingLog.weight = weight;
            existingLog.unit = unit || 'kg';
            existingLog.date = normalizedDate; // Normalize the date
            savedLog = await existingLog.save();

            // Delete any other duplicates that might exist for this day
            await WeightLog.deleteMany({
                clientId: client._id,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                _id: { $ne: existingLog._id }
            });
        } else {
            // Create new log
            savedLog = await WeightLog.create({
                clientId: client._id,
                date: normalizedDate,
                weight,
                unit: unit || 'kg'
            });
        }

        // Also update the current weight in the client profile
        await Client.findByIdAndUpdate(client._id, { $set: { weight } });

        // Log functionality for Live Feed
        try {
            const { logActivity } = await import('@/lib/activity-utils');
            await logActivity(client._id.toString(), 'WEIGHT_LOG', `Client updated weight to ${weight} ${unit || 'kg'}`, `${weight}${unit || 'kg'}`);
        } catch (err) {
            console.error('Failed to log activity:', err);
        }

        return NextResponse.json(savedLog, { status: 201 });
    } catch (error) {
        console.error('Failed to save weight log:', error);
        return NextResponse.json({ error: 'Failed to save weight log' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import PeriodLog from '@/models/PeriodLog';
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

        const logs = await PeriodLog.find({ clientId: client._id }).sort({ startDate: -1 }).limit(12);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch period logs:', error);
        return NextResponse.json({ error: 'Failed to fetch period logs' }, { status: 500 });
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

        const { startDate, endDate, flowIntensity, symptoms, notes } = await req.json();

        if (!startDate) {
            return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
        }

        // Normalize dates to start of day UTC
        const normalizedStart = normalizeDateUTC(startDate);
        const normalizedEnd = endDate ? normalizeDateUTC(endDate) : null;

        // Check if a log already exists for this start date
        const existingLog = await PeriodLog.findOne({
            clientId: client._id,
            startDate: normalizedStart
        });

        let savedLog;
        if (existingLog) {
            savedLog = await PeriodLog.findByIdAndUpdate(
                existingLog._id,
                { $set: { endDate: normalizedEnd, flowIntensity, symptoms, notes } },
                { new: true }
            );
        } else {
            savedLog = await PeriodLog.create({
                clientId: client._id,
                startDate: normalizedStart,
                endDate: normalizedEnd,
                flowIntensity,
                symptoms,
                notes
            });
        }

        return NextResponse.json(savedLog, { status: 201 });
    } catch (error) {
        console.error('Failed to save period log:', error);
        return NextResponse.json({ error: 'Failed to save period log' }, { status: 500 });
    }
}

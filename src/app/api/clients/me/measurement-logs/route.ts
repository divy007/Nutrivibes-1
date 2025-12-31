import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import MeasurementLog from '@/models/MeasurementLog';
import { getAuthUser } from '@/lib/auth';

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

        const logs = await MeasurementLog.find({ clientId: client._id }).sort({ date: -1 });
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch measurement logs:', error);
        return NextResponse.json({ error: 'Failed to fetch measurement logs' }, { status: 500 });
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

        const { chest, arms, waist, hips, thigh, unit, date } = await req.json();

        if (chest === undefined || arms === undefined || waist === undefined || hips === undefined || thigh === undefined) {
            return NextResponse.json({ error: 'All measurements are required' }, { status: 400 });
        }

        const newLog = await MeasurementLog.create({
            clientId: client._id,
            chest,
            arms,
            waist,
            hips,
            thigh,
            unit: unit || 'inch',
            date: date || new Date(),
        });

        // Update the client profile with latest measurements
        await Client.findByIdAndUpdate(client._id, {
            $set: {
                chest,
                arms,
                waist,
                hips,
                thigh
            }
        });

        return NextResponse.json(newLog, { status: 201 });
    } catch (error) {
        console.error('Failed to save measurement log:', error);
        return NextResponse.json({ error: 'Failed to save measurement log' }, { status: 500 });
    }
}

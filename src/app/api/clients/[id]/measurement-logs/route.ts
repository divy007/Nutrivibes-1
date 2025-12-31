import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MeasurementLog from '@/models/MeasurementLog';
import { getAuthUser } from '@/lib/auth';
import Client from '@/models/Client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (user.role === 'DIETICIAN' && client.dieticianId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const logs = await MeasurementLog.find({ clientId: id }).sort({ date: -1 });
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch measurement logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (client.dieticianId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { chest, arms, waist, hips, thigh, unit, date } = await req.json();

        const newLog = await MeasurementLog.create({
            clientId: id,
            chest,
            arms,
            waist,
            hips,
            thigh,
            unit: unit || 'inch',
            date: date || new Date(),
        });

        // Update client profile
        await Client.findByIdAndUpdate(id, {
            $set: { chest, arms, waist, hips, thigh }
        });

        return NextResponse.json(newLog, { status: 201 });
    } catch (error) {
        console.error('Failed to create measurement log:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

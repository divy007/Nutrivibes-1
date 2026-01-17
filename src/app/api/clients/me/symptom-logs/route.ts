import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import SymptomLog from '@/models/SymptomLog';
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

        const logs = await SymptomLog.find({ clientId: client._id }).sort({ date: -1 }).limit(30);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch symptom logs:', error);
        return NextResponse.json({ error: 'Failed to fetch symptom logs' }, { status: 500 });
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

        const { symptoms, energyLevel, notes, date } = await req.json();

        const today = normalizeDateUTC(date || undefined);

        // Update or create log for today
        const updatedLog = await SymptomLog.findOneAndUpdate(
            { clientId: client._id, date: today },
            {
                $set: {
                    symptoms,
                    energyLevel,
                    notes
                }
            },
            { upsert: true, new: true }
        );

        // Log functionality for Live Feed
        try {
            const { logActivity } = await import('@/lib/activity-utils');
            const symptomCount = symptoms?.length || 0;
            const desc = symptomCount > 0 ? `Client logged ${symptomCount} symptoms` : `Client updated symptom log`;
            await logActivity(client._id.toString(), 'SYMPTOM_LOG', desc, `Energy: ${energyLevel || '-'}`);
        } catch (err) {
            console.error('Failed to log activity:', err);
        }

        return NextResponse.json(updatedLog, { status: 201 });
    } catch (error) {
        console.error('Failed to save symptom log:', error);
        return NextResponse.json({ error: 'Failed to save symptom log' }, { status: 500 });
    }
}

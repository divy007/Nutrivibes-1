import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import StepLog from '@/models/StepLog';
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

        const { searchParams } = new URL(req.url);
        const clientDate = searchParams.get('date');
        const today = normalizeDateUTC(clientDate || undefined);

        let log = await StepLog.findOne({
            clientId: client._id,
            date: today
        });

        if (!log) {
            try {
                log = await StepLog.create({
                    clientId: client._id,
                    date: today,
                    steps: 0,
                    targetSteps: 10000
                });
            } catch (err: any) {
                if (err.code === 11000) {
                    log = await StepLog.findOne({
                        clientId: client._id,
                        date: today
                    });
                } else {
                    throw err;
                }
            }
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error('Failed to fetch step log:', error);
        return NextResponse.json({ error: 'Failed to fetch step log' }, { status: 500 });
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

        const { steps, targetSteps, date } = await req.json();
        const today = normalizeDateUTC(date || undefined);

        const updateFields: any = {};
        if (steps !== undefined) updateFields.steps = steps;
        if (targetSteps !== undefined) updateFields.targetSteps = targetSteps;

        const log = await StepLog.findOneAndUpdate(
            { clientId: client._id, date: today },
            { $set: updateFields },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Log functionality for Live Feed
        try {
            const { logActivity } = await import('@/lib/activity-utils');
            await logActivity(
                client._id.toString(),
                'STEPS_LOG',
                `Client logged steps`,
                `${log?.steps || 0}/${log?.targetSteps || 10000} steps`
            );
        } catch (err) {
            console.error('Failed to log activity:', err);
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error('Failed to update step log:', error);
        return NextResponse.json({ error: 'Failed to update step log' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import WeightLog from '@/models/WeightLog';
import WaterIntake from '@/models/WaterIntake';
import SymptomLog from '@/models/SymptomLog';
import { getAuthUser } from '@/lib/auth';
import { subDays } from 'date-fns';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id: clientId } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const followUps = await FollowUp.find({ clientId })
            .sort({ date: 1 })
            .populate('dieticianId', 'name')
            .lean();

        // Enhance with summaries
        const enhancedFollowUps = await Promise.all(followUps.map(async (fu: any) => {
            const fuDate = new Date(fu.date);
            const monthStart = subDays(fuDate, 30);

            // Fetch logs for the month preceding the follow-up
            const [weights, waters, symptoms] = await Promise.all([
                WeightLog.find({ clientId, date: { $gte: monthStart, $lte: fuDate } }).sort({ date: 1 }).lean(),
                WaterIntake.find({ clientId, date: { $gte: monthStart, $lte: fuDate } }).lean(),
                SymptomLog.find({ clientId, date: { $gte: monthStart, $lte: fuDate } }).lean()
            ]);

            // Calculate Summary
            const weightDiff = weights.length >= 2
                ? (weights[weights.length - 1].weight - weights[0].weight).toFixed(1)
                : null;

            const waterConsistency = waters.length > 0
                ? Math.round((waters.filter((w: any) => w.currentGlasses >= w.targetGlasses).length / waters.length) * 100)
                : null;

            const avgEnergy = symptoms.length > 0
                ? (symptoms.reduce((acc: number, s: any) => acc + s.energyLevel, 0) / symptoms.length).toFixed(1)
                : null;

            return {
                ...fu,
                summary: {
                    weightDiff,
                    waterConsistency,
                    avgEnergy,
                    logCount: waters.length
                }
            };
        }));

        return NextResponse.json(enhancedFollowUps);
    } catch (error) {
        console.error('Failed to fetch follow-ups:', error);
        return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id: clientId } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const followUp = await FollowUp.create({
            ...body,
            clientId,
            dieticianId: user._id,
        });

        return NextResponse.json(followUp);
    } catch (error) {
        console.error('Failed to create follow-up:', error);
        return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
    }
}

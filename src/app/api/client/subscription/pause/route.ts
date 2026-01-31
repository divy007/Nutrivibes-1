
import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Client from '@/models/Client';
import Plan from '@/models/Plan';
import { verifyToken } from '@/lib/auth';
import { normalizeDateUTC } from '@/lib/date-utils';
import { addDays, differenceInDays, isBefore } from 'date-fns';

export async function POST(req: Request) {
    await dbConnect();

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { days } = body;

        // 1. Min Days Validation
        if (!days || days < 7) {
            return NextResponse.json({ error: 'Minimum pause duration is 7 days.' }, { status: 400 });
        }

        const client = await Client.findOne({ userId: decoded.userId });
        if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

        // 2. Status Validation
        if (client.status === 'PAUSED') {
            return NextResponse.json({ error: 'Plan is already paused.' }, { status: 400 });
        }
        // Ideally checking for 'ACTIVE' is good, but let's just ensure not INACTIVE/DELETED/LEAD
        if (['INACTIVE', 'DELETED', 'LEAD'].includes(client.status)) {
            return NextResponse.json({ error: 'Plan is not active.' }, { status: 400 });
        }

        // 3. Subscription & Plan Limits
        const subscription = await Subscription.findOne({ clientId: client._id, status: 'ACTIVE' });
        if (!subscription) {
            return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 });
        }

        const plan = await Plan.findById(subscription.planId);
        // If custom plan or no plan found, assume 0 allowed? Or let's handle "No Pause Facility"
        const allowedTotal = plan?.allowedPauseDays || 0;

        if (allowedTotal === 0) {
            return NextResponse.json({ error: 'This plan does not include pause facility.' }, { status: 400 });
        }

        const used = subscription.pauseDaysUsed || 0;
        const extraPaid = subscription.extraPaidPauseDays || 0;
        const remaining = (allowedTotal + extraPaid) - used;

        if (days > remaining) {
            return NextResponse.json({
                error: 'PAUSE_LIMIT_EXCEEDED',
                message: `You have ${remaining} allowed pause days remaining. Requested: ${days}.`,
                details: {
                    allowed: allowedTotal,
                    used: used,
                    remaining: remaining,
                    requested: days,
                    costInfo: "500 INR for 15 days, 1000 INR for 30 days."
                }
            }, { status: 400 });
        }

        // 4. Apply Pause
        const today = normalizeDateUTC(new Date());
        const endDate = addDays(today, days);

        // Update Subscription
        subscription.status = 'PAUSED';
        subscription.pauseDaysUsed = used + days;
        subscription.pauseHistory.push({
            startDate: today,
            endDate: endDate,
            reason: 'Client requested pause via App'
        });

        // Extend Subscription End Date by 'days'
        subscription.endDate = addDays(new Date(subscription.endDate), days);
        await subscription.save();

        // Update Client
        client.previousStatus = client.status;
        client.status = 'PAUSED';
        client.pausedUntil = endDate;
        await client.save();

        return NextResponse.json({ success: true, message: `Plan paused for ${days} days. Resuming on ${endDate.toDateString()}.` });

    } catch (error) {
        console.error('Pause request error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

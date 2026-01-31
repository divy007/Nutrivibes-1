
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
        console.log('--- Pause Request Started ---');
        const authHeader = req.headers.get('Authorization');
        // console.log('Auth Header:', authHeader); // Be careful with tokens in logs
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('Pause Error: Missing/Invalid Auth Header');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded || decoded.role !== 'CLIENT') {
            console.log('Pause Error: Invalid Token or Role:', decoded);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        console.log('Pause Request Body:', body);
        const { days, startDate } = body;

        // 1. Min Days Validation
        if (!days || days < 7) {
            console.log('Pause Error: Invalid days:', days);
            return NextResponse.json({ error: 'Minimum pause duration is 7 days.' }, { status: 400 });
        }

        // Validate Start Date
        const today = normalizeDateUTC(new Date());
        let requestStartDate = today;

        if (startDate) {
            requestStartDate = normalizeDateUTC(new Date(startDate));
            console.log('Parsed Start Date:', requestStartDate, 'Today:', today);

            // Allow today as start date
            if (isBefore(requestStartDate, today)) {
                console.log('Pause Error: Start date in past');
                return NextResponse.json({ error: 'Start date cannot be in the past.' }, { status: 400 });
            }
        }

        // ... find client ...
        // ... validate status ...
        const client = await Client.findOne({ userId: decoded.userId });
        if (!client) {
            console.log('Pause Error: Client not found for user:', decoded.userId);
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        if (client.status === 'PAUSED') {
            console.log('Pause Error: Client already paused');
            return NextResponse.json({ error: 'Plan is already paused.' }, { status: 400 });
        }

        // 3. Subscription & Plan Limits
        const subscription = await Subscription.findOne({
            clientId: client._id,
            status: { $in: ['ACTIVE', 'ASSIGNED'] }
        });

        if (!subscription) {
            console.log('Pause Error: No active or assigned subscription found for client:', client._id);
            const anySub = await Subscription.findOne({ clientId: client._id });
            console.log('DEBUG: Any subscription found?', !!anySub, 'Status:', anySub?.status);
            return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 });
        }

        // Check if there is already a pending request
        const hasPending = subscription.pauseRequests?.some((r: any) => r.status === 'PENDING');
        if (hasPending) {
            console.log('Pause Error: Pending request exists');
            return NextResponse.json({ error: 'You already have a pending pause request.' }, { status: 400 });
        }

        const plan = await Plan.findById(subscription.planId);
        const allowedTotal = plan?.allowedPauseDays || 0;

        const used = subscription.pauseDaysUsed || 0;
        const extraPaid = subscription.extraPaidPauseDays || 0;
        const remaining = (allowedTotal + extraPaid) - used;

        console.log(`Limits - Allowed: ${allowedTotal}, Used: ${used}, Remaining: ${remaining}, Requested: ${days}`);

        if (days > remaining) {
            console.log('Pause Error: Limit exceeded');
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

        // 4. Create Pause Request (Pending Approval)
        if (!subscription.pauseRequests) subscription.pauseRequests = [];

        subscription.pauseRequests.push({
            requestDate: new Date(),
            startDate: requestStartDate,
            durationDays: days,
            reason: 'Client requested via App',
            status: 'PENDING'
        });

        await subscription.save();
        console.log('Pause Request Saved Successfully');

        return NextResponse.json({
            success: true,
            message: `Pause request submitted for approval. Start Date: ${requestStartDate.toDateString()}`
        });

    } catch (error) {
        console.error('Pause request CRITICAL error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

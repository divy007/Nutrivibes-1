import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import { addDays } from 'date-fns';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find subscriptions with PENDING requests
        const subscriptions = await Subscription.find({
            'pauseRequests.status': 'PENDING'
        }).populate('clientId', 'name email phone profileImage');

        const pendingRequests: any[] = [];

        subscriptions.forEach((sub: any) => {
            if (sub.pauseRequests) {
                sub.pauseRequests.forEach((req: any) => {
                    if (req.status === 'PENDING') {
                        pendingRequests.push({
                            _id: req._id,
                            clientId: sub.clientId?._id,
                            clientName: sub.clientId?.name || 'Unknown Client',
                            clientImage: sub.clientId?.profileImage,
                            planName: sub.planName,
                            requestDate: req.requestDate,
                            startDate: req.startDate,
                            durationDays: req.durationDays,
                            reason: req.reason
                        });
                    }
                });
            }
        });

        // Sort by request date desc
        pendingRequests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime());

        return NextResponse.json(pendingRequests);
    } catch (error: any) {
        console.error('Failed to fetch pause requests:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { clientId, requestId, action } = body; // action: 'APPROVE' | 'REJECT'

        if (!clientId || !requestId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const subscription = await Subscription.findOne({
            clientId: clientId,
            status: { $in: ['ACTIVE', 'ASSIGNED'] }
        });

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not active or found' }, { status: 404 });
        }

        // Find the request subdocument
        const request = (subscription.pauseRequests as any).id(requestId);
        if (!request) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        if (request.status !== 'PENDING') {
            return NextResponse.json({ error: 'Request already processed' }, { status: 400 });
        }

        if (action === 'REJECT') {
            request.status = 'REJECTED';
            await subscription.save();
            return NextResponse.json({ success: true, message: 'Request rejected' });
        }

        if (action === 'APPROVE') {
            // APPLY PAUSE LOGIC
            const startDate = new Date(request.startDate);
            const duration = request.durationDays;
            const endDate = addDays(startDate, duration);

            // 1. Update Subscription Status
            // IMPORTANT: If start date is TODAY, set status PAUSED.
            // If start date is FUTURE, do we set status?
            // "Scheduled Pause" is not a status we have.
            // Option: We approve it, but the status change needs to happen ON start date.
            // OR we just mark it approved, and a cron job handles it?
            // OR we rely on 'pauseHistory' to know when it is paused?
            //
            // User requirement: "client will be able see in the diet plan saying your pause request accepted."
            //
            // Current System Limitation: No 'SCHEDULED_PAUSE' status.
            // Strategy:
            // - We update `pauseHistory` (future entry).
            // - We extend `endDate` NOW.
            // - Does `status` need to change?
            //   - If today >= startDate: Change to PAUSED.
            //   - If future: Keep ACTIVE. BUT filtering logic needs to know about future pause?
            //   - Simple approach: Mark approved. We need a way to trigger 'PAUSED' status on that day.
            //   - Without cron, we can't auto-switch.
            //   - User said: "used pause day and remaining pause day will be updated in the client mobile app side."
            //
            //   - If we update `pauseDaysUsed` now, it counts immediately.
            //
            // Let's try to match existing logic:
            // "subscription.status = 'PAUSED'"
            // "subscription.endDate = addDays(currentEndDate, days)"
            //
            // If I approve a FUTURE pause, and set status PAUSED, the user is locked out NOW. That's bad.
            //
            // Compromise:
            // 1. Update `pauseDaysUsed` (+days).
            // 2. Update `endDate` (+days).
            // 3. Add to `pauseHistory`.
            // 4. Update request status 'APPROVED'.
            // 5. IF startDate <= today: Set status 'PAUSED'.
            // 6. IF startDate > today: Alert dietician? Or just rely on dates.
            //    Our App checks `status`. If status is ACTIVE, they have access.
            //    So during the "Pause Period", they would still have access if status is ACTIVE.
            //    We need a check: isTodayInPausePeriod?
            //
            // Let's implement: Status changes to PAUSED immediately if startDate is today.
            // If future, we assume it's "Pre-approved" and maybe status update is manual or ignored?
            // Or we check effectively: `isPaused = status === 'PAUSED' || pauseHistory.some(p => now >= p.start && now <= p.end)`?
            //
            // Given constraints, I will:
            // - Always extend end date.
            // - Always update usage.
            // - Set status PAUSED only if today >= startDate.

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const reqStart = new Date(startDate);
            reqStart.setHours(0, 0, 0, 0);

            if (reqStart <= today) {
                subscription.status = 'PAUSED';
            }

            subscription.pauseDaysUsed = (subscription.pauseDaysUsed || 0) + duration;
            subscription.pauseHistory.push({
                startDate: startDate,
                endDate: endDate,
                reason: request.reason || 'Approved Request'
            });

            subscription.endDate = addDays(new Date(subscription.endDate), duration);

            request.status = 'APPROVED';

            await subscription.save();

            // Also update Client status for consistency if immediate
            if (reqStart <= today) {
                // We need to import Client or just ignore for now as Subscription is source of truth?
                // `Client` model import is at top.
                await Client.findByIdAndUpdate(clientId, {
                    status: 'PAUSED',
                    pausedUntil: endDate
                });
            }

            return NextResponse.json({ success: true, message: 'Request approved and applied' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Failed to process pause request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

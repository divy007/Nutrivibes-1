import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import { addMonths, addDays, differenceInDays } from 'date-fns';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    try {
        const { id } = await params;
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Clients can see their own subscription, Dieticians can see any
        if (user.role === 'CLIENT') {
            const client = await Client.findOne({ userId: user._id });
            if (!client || client._id.toString() !== id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        // Find the active or most recent subscription
        // Sort by endDate desc to get the latest
        const subscription = await Subscription.findOne({ clientId: id }).sort({ endDate: -1 });

        return NextResponse.json(subscription || null);
    } catch (error) {
        console.error('Failed to fetch subscription:', error);
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
}

// Assign a new Plan (Create Subscription)
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    try {
        const { id } = await params;
        const user = await getAuthUser(req);
        // Only Dieticians can assign plans
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { planId, planName, customPrice, customDurationMonths, startDate } = body;

        if (!planName || !customPrice || !customDurationMonths || !startDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const start = new Date(startDate);
        const end = addMonths(start, customDurationMonths);

        // Deactivate any currently active subscriptions for this client?
        // Implementation choice: Mark old ones as EXPIRED or just let them coexist?
        // Usually better to have only one ACTIVE.
        await Subscription.updateMany(
            { clientId: id, status: 'ACTIVE' },
            { $set: { status: 'EXPIRED' } }
        );

        const newSubscription = await Subscription.create({
            clientId: id,
            planId: planId || null, // null if purely custom
            planName,
            startDate: start,
            endDate: end,
            totalAmount: customPrice,
            amountPaid: 0,
            status: 'PENDING_PAYMENT',
            paymentHistory: [],
            pauseHistory: []
        });

        return NextResponse.json(newSubscription, { status: 201 });
    } catch (error) {
        console.error('Failed to assign plan:', error);
        return NextResponse.json({ error: 'Failed to assign plan' }, { status: 500 });
    }
}

// Record Payment (PATCH)
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    try {
        const { id } = await params; // id here is clientId, but we might need subscriptionId
        // Actually REST standard usually puts ID as the resource ID. 
        // But here the route is /api/clients/[id]/subscription which implies "THE subscription for client [id]"
        // So we operate on the active subscription of this client.

        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, method, note, subscriptionId } = body;

        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        // Add payment
        subscription.paymentHistory.push({
            date: new Date(),
            amount,
            method,
            note
        });

        subscription.amountPaid += amount;

        // Auto-update status if paid in full?
        if (subscription.status === 'PENDING_PAYMENT' && amount > 0) {
            subscription.status = 'ACTIVE';
        }

        if (subscription.amountPaid >= subscription.totalAmount) {
            // Should we mark completed? No, COMPLETED is for time duration.
            // Maybe just keep ACTIVE.
        }

        await subscription.save();
        return NextResponse.json(subscription);

    } catch (error) {
        console.error('Failed to record payment:', error);
        return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }
}

// Pause/Resume (PUT)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    try {
        const { id } = await params;
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, subscriptionId, reason } = body; // action: 'PAUSE' | 'RESUME'

        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (action === 'PAUSE') {
            if (subscription.status === 'PAUSED') {
                return NextResponse.json({ error: 'Already paused' }, { status: 400 });
            }
            subscription.status = 'PAUSED';
            subscription.pauseHistory.push({
                startDate: new Date(),
                reason: reason || 'Dietician Paused'
            });
        } else if (action === 'RESUME') {
            if (subscription.status !== 'PAUSED') {
                return NextResponse.json({ error: 'Not paused' }, { status: 400 });
            }

            // Find the active pause entry (one without endDate)
            const pauseEntry = subscription.pauseHistory.find((p: any) => !p.endDate);
            if (pauseEntry) {
                pauseEntry.endDate = new Date();

                // Calculate days paused
                const daysPaused = differenceInDays(new Date(), new Date(pauseEntry.startDate));

                // Extend the total endDate of the subscription
                if (daysPaused > 0) {
                    subscription.endDate = addDays(new Date(subscription.endDate), daysPaused);
                }
            }
            subscription.status = 'ACTIVE';
        }

        await subscription.save();
        return NextResponse.json(subscription);
    } catch (error) {
        console.error('Failed to update status:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}

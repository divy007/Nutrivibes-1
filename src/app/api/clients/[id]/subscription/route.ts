import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import Subscription from '@/models/Subscription';
import Plan from '@/models/Plan';
import mongoose from 'mongoose';
import { differenceInDays, addDays } from 'date-fns';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    try {
        const { action, planId } = await req.json();

        if (!['ASSIGN', 'RENEW', 'UPGRADE'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be ASSIGN, RENEW, or UPGRADE' }, { status: 400 });
        }

        if (!mongoose.isValidObjectId(planId)) {
            return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
        }

        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const newPlan = await Plan.findById(planId);
        if (!newPlan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        // ============================================================
        // FIND CURRENT SUBSCRIPTION
        // ============================================================
        const currentSubscription = await Subscription.findOne({
            clientId: id as any,
            status: { $in: ['ASSIGNED', 'ACTIVE', 'PAUSED'] },
            endDate: { $gte: new Date() } // Not expired
        }).sort({ startDate: -1 });

        const today = new Date();
        const dietStarted = client.dietStartDate && new Date(client.dietStartDate) <= today;

        let startDate: Date = new Date();
        let endDate: Date = new Date();
        let price = newPlan.price;
        let status: 'ASSIGNED' | 'ACTIVE' = 'ASSIGNED';
        let oldSubscriptionToUpdate = null;

        // ============================================================
        // ACTION: ASSIGN
        // Initial plan assignment (before diet starts)
        // ============================================================
        if (action === 'ASSIGN') {
            console.log('[Subscription API] ASSIGN action triggered. Diet started?', dietStarted, 'Client dietStartDate:', client.dietStartDate);

            // Validate: Can only assign if diet hasn't started
            if (dietStarted) {
                console.log('[Subscription API] ASSIGN failed: Diet already started');
                return NextResponse.json({
                    error: 'Cannot assign plan after diet has started. Use UPGRADE or RENEW instead.'
                }, { status: 400 });
            }

            // Set dates: If dietStartDate is set, use it. Otherwise, use placeholder (pending).
            if (client.dietStartDate) {
                startDate = new Date(client.dietStartDate);
                const durationDays = newPlan.durationMonths * 30;
                endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + durationDays);
            } else {
                // No diet start date yet - subscription is assigned but pending
                // Use placeholder dates that will be updated when diet start date is set
                startDate = new Date('2099-12-31');
                endDate = new Date('2099-12-31');
            }

            // Status: ASSIGNED (will become ACTIVE when diet starts)
            status = 'ASSIGNED';
            price = newPlan.price;

            console.log('[Subscription API] ASSIGN - Start date:', startDate, 'End date:', endDate, 'Pending:', !client.dietStartDate);
        }

        // ============================================================
        // ACTION: RENEW
        // Extend subscription after expiry
        // ============================================================
        else if (action === 'RENEW') {
            // Validate: Diet must have started
            if (!dietStarted) {
                return NextResponse.json({
                    error: 'Cannot renew before diet starts. Use ASSIGN instead.'
                }, { status: 400 });
            }

            // Validate: Current subscription should be near expiry
            if (currentSubscription) {
                const daysUntilExpiry = Math.ceil(
                    (new Date(currentSubscription.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                if (daysUntilExpiry > 7) {
                    return NextResponse.json({
                        error: `Cannot renew yet. Current subscription expires in ${daysUntilExpiry} days. Renew within 7 days of expiry.`
                    }, { status: 400 });
                }
            }

            // Set dates: Start after current subscription ends (or today if expired)
            if (currentSubscription && new Date(currentSubscription.endDate) > today) {
                const dayAfterEnd = new Date(currentSubscription.endDate);
                dayAfterEnd.setDate(dayAfterEnd.getDate() + 1);
                startDate = dayAfterEnd;
            } else {
                startDate = today;
            }

            const durationDays = newPlan.durationMonths * 30;
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + durationDays);

            status = 'ACTIVE';
            price = newPlan.price;
        }

        // ============================================================
        // ACTION: UPGRADE
        // Switch to longer plan (within 30 days of diet start)
        // ============================================================
        else if (action === 'UPGRADE') {
            // Validate: Diet must have started
            if (!dietStarted) {
                return NextResponse.json({
                    error: 'Cannot upgrade before diet starts. Use ASSIGN instead.'
                }, { status: 400 });
            }

            // Validate: Must have active subscription
            if (!currentSubscription || currentSubscription.status !== 'ACTIVE') {
                return NextResponse.json({
                    error: 'No active subscription to upgrade'
                }, { status: 400 });
            }

            // Validate: Within 30-day window
            const subscriptionStartDate = new Date(currentSubscription.startDate);
            const daysSinceStart = Math.ceil(
                (today.getTime() - subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSinceStart > 30) {
                return NextResponse.json({
                    error: 'Upgrades are only allowed within 30 days of subscription start'
                }, { status: 400 });
            }

            // Validate: New plan must have longer duration
            const currentPlan = await Plan.findById(currentSubscription.planId);
            if (!currentPlan) {
                return NextResponse.json({ error: 'Current plan not found' }, { status: 404 });
            }

            if (newPlan.durationMonths <= currentPlan.durationMonths) {
                return NextResponse.json({
                    error: 'Upgrade requires a plan with longer duration'
                }, { status: 400 });
            }

            // Set dates: Backdate to original start
            startDate = new Date(currentSubscription.startDate);
            const durationDays = newPlan.durationMonths * 30;
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + durationDays);

            // Calculate price difference
            price = Math.max(0, newPlan.price - currentPlan.price);

            // Mark old subscription for upgrade
            oldSubscriptionToUpdate = currentSubscription;
            status = 'ACTIVE';
        }


        // Check for any pending referral rewards to apply
        // We only apply them if the subscription is not in the placeholder state (not set to 2099)
        const pendingDays = client.pendingReferralDays || 0;
        if (pendingDays > 0 && endDate.getFullYear() < 2099) {
            console.log(`[Subscription API] Applying ${pendingDays} pending referral days to client ${client._id}`);
            endDate.setDate(endDate.getDate() + pendingDays);
            
            if (!client.referralRewards) {
                client.referralRewards = [];
            }
            client.referralRewards.push({
                date: new Date(),
                daysEarned: pendingDays,
                fromClientId: client._id,
                note: `Redeemed ${pendingDays} pending referral days upon subscription activation`
            });
            client.pendingReferralDays = 0;
            await client.save();
        }

        // ============================================================
        // UPDATE EXISTING OR CREATE NEW SUBSCRIPTION
        // One subscription per client - update if exists, create if new
        // ============================================================

        // Find existing subscription for this client (any status)
        const existingSubscription = await Subscription.findOne({ clientId: id as any });

        let subscription;

        if (existingSubscription) {
            // UPDATE existing subscription
            console.log('[Subscription API] Updating existing subscription:', existingSubscription._id);

            // Add to plan history
            existingSubscription.planHistory.push({
                changedAt: new Date(),
                action: action as 'ASSIGN' | 'UPGRADE' | 'RENEW',
                oldPlanId: existingSubscription.planId,
                newPlanId: planId,
                oldPlanName: existingSubscription.planName,
                newPlanName: newPlan.name,
                oldAmount: existingSubscription.totalAmount,
                newAmount: price
            });

            // Update fields
            existingSubscription.planId = planId;
            existingSubscription.planName = newPlan.name;
            existingSubscription.startDate = startDate!;
            existingSubscription.endDate = endDate!;
            existingSubscription.totalAmount = price;
            existingSubscription.status = status;

            // Reset payment for RENEW
            if (action === 'RENEW') {
                existingSubscription.amountPaid = 0;
            }

            subscription = await existingSubscription.save();
        } else {
            // CREATE new subscription (first time)
            console.log('[Subscription API] Creating new subscription for client:', id);

            subscription = await Subscription.create({
                clientId: id as any,
                planId: planId,
                planName: newPlan.name,
                startDate: startDate!,
                endDate: endDate!,
                totalAmount: price,
                amountPaid: 0,
                status: status,
                paymentHistory: [],
                planHistory: [{
                    changedAt: new Date(),
                    action: 'ASSIGN',
                    newPlanId: planId,
                    newPlanName: newPlan.name,
                    newAmount: price
                }]
            });
        }

        console.log(`[Subscription API] ${action} successful:`, {
            subscriptionId: subscription._id,
            startDate: startDate,
            endDate: endDate,
            status: status,
            price: price,
            updated: !!existingSubscription
        });

        if (status === 'ACTIVE' && newPlan) {
            const { processReferralReward } = await import('@/lib/referral');
            await processReferralReward(id, newPlan.durationMonths);
        }

        return NextResponse.json({
            success: true,
            message: `Plan ${action.toLowerCase()}ed successfully`,
            subscription: subscription
        });

    } catch (error: any) {
        console.error('[Subscription API] Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to process subscription'
        }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    try {
        const subscriptions = await Subscription.find({ clientId: id as any }).sort({ startDate: -1 });
        return NextResponse.json(subscriptions);
    } catch (error) {
        console.error('Error fetching subscriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    try {
        const { subscriptionId, action, reason } = await req.json();

        if (!['PAUSE', 'RESUME'].includes(action)) {
            return NextResponse.json({ error: 'Invalid action. Must be PAUSE or RESUME' }, { status: 400 });
        }

        if (!mongoose.isValidObjectId(subscriptionId)) {
            return NextResponse.json({ error: 'Invalid subscription ID' }, { status: 400 });
        }

        const subscription = await Subscription.findById(subscriptionId);
        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
        }

        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const today = new Date();

        if (action === 'PAUSE') {
            if (subscription.status === 'PAUSED') {
                return NextResponse.json({ error: 'Subscription is already paused' }, { status: 400 });
            }

            subscription.status = 'PAUSED';
            if (!subscription.pauseHistory) {
                subscription.pauseHistory = [];
            }
            subscription.pauseHistory.push({
                startDate: today,
                reason: reason || 'Manual dietician pause'
            });

            client.status = 'PAUSED';
            client.pausedUntil = undefined; // Indefinite manual pause

            await Promise.all([subscription.save(), client.save()]);
        } else if (action === 'RESUME') {
            if (subscription.status !== 'PAUSED') {
                return NextResponse.json({ error: 'Subscription is not paused' }, { status: 400 });
            }

            subscription.status = 'ACTIVE';

            // Find the active pause entry in pauseHistory
            const activePause = subscription.pauseHistory?.find((h: any) => !h.endDate);
            if (activePause) {
                activePause.endDate = today;
                const duration = Math.max(1, differenceInDays(today, new Date(activePause.startDate)));
                subscription.pauseDaysUsed = (subscription.pauseDaysUsed || 0) + duration;
                subscription.endDate = addDays(new Date(subscription.endDate), duration);
            }

            client.status = 'ACTIVE';
            client.pausedUntil = undefined;

            await Promise.all([subscription.save(), client.save()]);
        }

        return NextResponse.json({
            success: true,
            message: `Subscription ${action.toLowerCase()}d successfully`,
            subscription
        });

    } catch (error: any) {
        console.error('[Subscription PUT] Error:', error);
        return NextResponse.json({
            error: error.message || 'Failed to update subscription status'
        }, { status: 500 });
    }
}

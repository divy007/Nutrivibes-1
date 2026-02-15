import Client from '@/models/Client';
import Subscription from '@/models/Subscription';

/**
 * Processes the referral reward for a client's plan purchase.
 * If the client was referred and hasn't been rewarded yet, this function
 * calculates the reward days and extends the referrer's subscription.
 */
export async function processReferralReward(clientId: string, planDurationMonths: number) {
    try {
        console.log(`[Referral] Checking eligibility for client: ${clientId}`);

        // 1. Fetch Client to check referrer
        const client = await Client.findById(clientId);
        if (!client) {
            console.log('[Referral] Client not found');
            return;
        }

        if (!client.referredBy) {
            console.log('[Referral] Client was not referred');
            return;
        }

        if (client.referralStatus === 'REWARDED') {
            console.log('[Referral] Reward already granted for this client');
            return;
        }

        // 2. Calculate Reward
        // 3m -> 15d, 6m -> 30d, 9m -> 45d, 12m -> 60d
        let rewardDays = 0;
        if (planDurationMonths >= 12) rewardDays = 60;
        else if (planDurationMonths >= 9) rewardDays = 45;
        else if (planDurationMonths >= 6) rewardDays = 30;
        else if (planDurationMonths >= 3) rewardDays = 15;

        if (rewardDays === 0) {
            console.log(`[Referral] Plan duration (${planDurationMonths}m) too short for reward`);
            return;
        }

        console.log(`[Referral] Eligible for ${rewardDays} days reward. Referrer: ${client.referredBy}`);

        // 3. Find Referrer's Subscription
        const referrer = await Client.findById(client.referredBy);
        if (!referrer) {
            console.log('[Referral] Referrer account not found');
            return;
        }

        // Find the latest subscription for the referrer
        const referrerSubscription = await Subscription.findOne({
            clientId: referrer._id,
        }).sort({ endDate: -1 });

        if (referrerSubscription) {
            const today = new Date();
            const currentEndDate = new Date(referrerSubscription.endDate);

            // Logic: If active, extend from current end date.
            // If expired, extend from TODAY (revive it).
            let baseDate = currentEndDate > today ? currentEndDate : today;

            const newEndDate = new Date(baseDate);
            newEndDate.setDate(newEndDate.getDate() + rewardDays);

            console.log(`[Referral] Extending referrer subscription. Old End: ${referrerSubscription.endDate.toISOString()}, New End: ${newEndDate.toISOString()}`);

            referrerSubscription.endDate = newEndDate;

            // If it was expired or cancelled, reviving it to ACTIVE makes sense if we are adding days.
            if (['EXPIRED', 'COMPLETED', 'PAUSED'].includes(referrerSubscription.status)) {
                referrerSubscription.status = 'ACTIVE';
            }

            await referrerSubscription.save();

            // 4. Log Reward in Referrer's Profile
            await Client.findByIdAndUpdate(referrer._id, {
                $push: {
                    referralRewards: {
                        date: new Date(),
                        daysEarned: rewardDays,
                        fromClientId: client._id,
                        note: `Referral reward from ${client.name}`
                    }
                }
            });

            // 5. Update Referee Status
            client.referralStatus = 'REWARDED';
            await client.save();

            console.log('[Referral] Reward processed successfully.');
        } else {
            console.log('[Referral] Referrer has no subscription history. Skipping reward application.');
            // Optional: Should we store "Pending Rewards" for when they eventually buy a subscription? 
            // For now, ignoring as per typical simple logic.
        }

    } catch (error) {
        console.error('[Referral] Error processing reward:', error);
    }
}

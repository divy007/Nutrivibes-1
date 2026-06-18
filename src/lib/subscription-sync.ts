import Client from '@/models/Client';
import Subscription from '@/models/Subscription';

/**
 * Syncs the subscription status of a client dynamically based on their pause history
 * and plan start dates.
 * 
 * @param clientId The ID of the client to sync
 * @returns The updated active subscription if any
 */
export async function syncClientSubscription(clientId: any) {
    const activeSub = await Subscription.findOne({
        clientId: clientId,
        status: { $in: ['ASSIGNED', 'ACTIVE', 'PAUSED'] }
    }).sort({ createdAt: -1 });

    if (!activeSub) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let statusChanged = false;
    let newStatus = activeSub.status;

    // Check if currently inside a pause window
    const inPauseWindow = activeSub.pauseHistory?.some((p: any) => {
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        return today >= start && today < end;
    });

    if (inPauseWindow) {
        if (activeSub.status !== 'PAUSED') {
            newStatus = 'PAUSED';
            statusChanged = true;
        }
    } else {
        // Not in pause window. Should be ACTIVE or ASSIGNED.
        if (activeSub.status === 'PAUSED') {
            // Un-pause
            newStatus = 'ACTIVE';
            statusChanged = true;
        } else if (activeSub.status === 'ASSIGNED') {
            // Check if we should activate
            if (activeSub.startDate) {
                const start = new Date(activeSub.startDate);
                start.setHours(0, 0, 0, 0);
                if (today >= start) {
                    newStatus = 'ACTIVE';
                    statusChanged = true;
                }
            }
        }
    }

    if (statusChanged) {
        console.log(`Auto-Updating Subscription ${activeSub._id} status: ${activeSub.status} -> ${newStatus}`);
        activeSub.status = newStatus;
        await activeSub.save();

        // Sync Client Status
        if (newStatus === 'PAUSED') {
            await Client.findByIdAndUpdate(clientId, { status: 'PAUSED' });
        } else if (newStatus === 'ACTIVE') {
            await Client.findByIdAndUpdate(clientId, { status: 'ACTIVE' });
        }
    }

    return activeSub;
}

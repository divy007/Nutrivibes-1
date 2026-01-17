import ActivityLog from '@/models/ActivityLog';
import Client from '@/models/Client';

/**
 * Logs a client activity to the ActivityLog collection.
 * Silently fails on error to prevent blocking the main action.
 */
export async function logActivity(
    clientId: string,
    type: 'WEIGHT_LOG' | 'WATER_LOG' | 'MEASUREMENT_LOG' | 'SYMPTOM_LOG' | 'PERIOD_LOG' | 'PROFILE_UPDATE',
    description: string,
    value?: string
) {
    try {
        // We need the dieticianId to associate the log correctly
        const client = await Client.findById(clientId).select('dieticianId');
        if (!client || !client.dieticianId) return;

        await ActivityLog.create({
            dieticianId: client.dieticianId,
            clientId,
            type,
            description,
            value,
            timestamp: new Date()
        });
    } catch (error) {
        console.warn('Failed to log activity:', error);
        // Do not throw, so the main API call succeeds
    }
}

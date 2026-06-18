import FollowUp from '@/models/FollowUp';
import { addDays } from 'date-fns';

/**
 * Automatically schedules progress check-ins at Day 7, 14, 21, and 28
 * from the client's dietStartDate. Existing pending 'Diet' check-ins
 * will be deleted to avoid duplication.
 *
 * @param clientId The MongoDB ID of the client
 * @param dieticianId The MongoDB ID of the dietician
 * @param dietStartDate The start date of the diet plan
 */
export async function generateFollowUps(clientId: string, dieticianId: string, dietStartDate: Date) {
    // 1. Delete existing pending check-ins of category 'Diet' for this client to prevent duplication
    await FollowUp.deleteMany({
        clientId,
        status: 'Pending',
        category: 'Diet'
    });

    // 2. Generate check-ins at Day 7, 14, 21, and 28
    const intervals = [7, 14, 21, 28];
    const followUpsToCreate = intervals.map((days) => {
        const checkInDate = addDays(new Date(dietStartDate), days);
        // Set a standard morning check-in time (e.g. 9:00 AM UTC)
        checkInDate.setUTCHours(9, 0, 0, 0);

        return {
            clientId,
            dieticianId,
            date: checkInDate,
            timing: '09:00 AM',
            category: 'Diet',
            status: 'Pending',
            notes: `Auto-generated check-in for Day ${days}`
        };
    });

    await FollowUp.insertMany(followUpsToCreate);
    console.log(`[FollowUp Utils] Auto-generated 4 follow-ups for client ${clientId} starting from ${dietStartDate}`);
}

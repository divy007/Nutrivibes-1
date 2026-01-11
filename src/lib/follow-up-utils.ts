import FollowUp from '@/models/FollowUp';
import { addMonths } from 'date-fns';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function generateFollowUps(clientId: string, dieticianId: string, startDate: Date) {
    // Delete existing PENDING follow-ups to avoid duplicates if start date is changed
    await FollowUp.deleteMany({
        clientId,
        status: 'Pending'
    });

    const followUps = [];
    // Generate follow-ups for the next 6 months
    for (let i = 1; i <= 6; i++) {
        const followUpDate = normalizeDateUTC(addMonths(new Date(startDate), i));
        followUps.push({
            clientId,
            dieticianId,
            date: followUpDate,
            timing: '11:00 am', // Default timing
            category: 'Consultation', // More appropriate for monthly
            status: 'Pending'
        });
    }

    await FollowUp.insertMany(followUps);
}

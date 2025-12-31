import FollowUp from '@/models/FollowUp';
import { addDays } from 'date-fns';

export async function generateFollowUps(clientId: string, dieticianId: string, startDate: Date) {
    // Delete existing PENDING follow-ups to avoid duplicates if start date is changed
    await FollowUp.deleteMany({
        clientId,
        status: 'Pending'
    });

    const followUps = [];
    // Generate follow-ups for the next 12 weeks (7 days interval)
    for (let i = 1; i <= 12; i++) {
        const followUpDate = addDays(new Date(startDate), i * 7);
        followUps.push({
            clientId,
            dieticianId,
            date: followUpDate,
            timing: '11:00 am', // Default timing
            category: 'Diet',
            status: 'Pending'
        });
    }

    await FollowUp.insertMany(followUps);
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function GET(req: Request) {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    try {
        const targetDate = normalizeDateUTC(new Date(dateStr));

        // Find all Pending or Completed follow-ups for this date
        const bookedSlots = await FollowUp.find({
            date: targetDate,
            status: { $in: ['Pending', 'Completed'] }
        }).select('timing');

        const timings = bookedSlots.map(slot => slot.timing);

        return NextResponse.json({ bookedSlots: timings });
    } catch (error) {
        console.error('Failed to fetch booked slots:', error);
        return NextResponse.json({ error: 'Failed to fetch booked slots' }, { status: 500 });
    }
}

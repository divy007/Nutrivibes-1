import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id: clientId } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const followUps = await FollowUp.find({ clientId })
            .sort({ date: -1 })
            .populate('dieticianId', 'name'); // To get coach name if needed

        return NextResponse.json(followUps);
    } catch (error) {
        console.error('Failed to fetch follow-ups:', error);
        return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id: clientId } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const followUp = await FollowUp.create({
            ...body,
            clientId,
            dieticianId: user._id,
        });

        return NextResponse.json(followUp);
    } catch (error) {
        console.error('Failed to create follow-up:', error);
        return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
    }
}

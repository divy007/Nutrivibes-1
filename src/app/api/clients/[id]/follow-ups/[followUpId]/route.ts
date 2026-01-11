import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import FollowUp from '@/models/FollowUp';
import { getAuthUser } from '@/lib/auth';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string, followUpId: string }> }) {
    await dbConnect();
    const { id: clientId, followUpId } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        if (body.date) {
            body.date = normalizeDateUTC(body.date);
        }

        const updatedFollowUp = await FollowUp.findOneAndUpdate(
            { _id: followUpId, clientId, dieticianId: user._id },
            body,
            { new: true }
        );

        if (!updatedFollowUp) {
            return NextResponse.json({ error: 'Follow-up not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json(updatedFollowUp);
    } catch (error) {
        console.error('Failed to update follow-up:', error);
        return NextResponse.json({ error: 'Failed to update follow-up' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, followUpId: string }> }) {
    await dbConnect();
    const { id: clientId, followUpId } = await params;

    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const deletedFollowUp = await FollowUp.findOneAndDelete({
            _id: followUpId,
            clientId,
            dieticianId: user._id,
        });

        if (!deletedFollowUp) {
            return NextResponse.json({ error: 'Follow-up not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Follow-up deleted successfully' });
    } catch (error) {
        console.error('Failed to delete follow-up:', error);
        return NextResponse.json({ error: 'Failed to delete follow-up' }, { status: 500 });
    }
}

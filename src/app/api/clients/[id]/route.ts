import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }
        return NextResponse.json(client);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const body = await req.json();
        const client = await Client.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Trigger automatic follow-up generation if dietStartDate was updated
        if (body.dietStartDate) {
            try {
                const { generateFollowUps } = await import('@/lib/follow-up-utils');
                await generateFollowUps(client._id.toString(), client.dieticianId.toString(), new Date(body.dietStartDate));
            } catch (err) {
                console.error('Failed to auto-generate follow-ups:', err);
                // We don't fail the client update if follow-up generation fails
            }
        }

        return NextResponse.json(client);
    } catch {
        return NextResponse.json({ error: 'Failed to update client' }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Stage 1: If client is NOT already 'DELETED', perform soft delete
        if (client.status !== 'DELETED') {
            // Mark as DELETED
            await Client.findByIdAndUpdate(id, { $set: { status: 'DELETED' } });

            // Hard delete the associated user account to prevent login
            if (client.userId) {
                try {
                    const User = (await import('@/models/User')).default;
                    await User.findByIdAndDelete(client.userId);
                } catch (userErr) {
                    console.warn('Failed to delete associated user account:', userErr);
                }
            }
            return NextResponse.json({ message: 'Client marked as deleted and user account removed' });
        }

        // Stage 2: If client is ALREADY 'DELETED', perform PERMANENT removal
        const FollowUp = (await import('@/models/FollowUp')).default;
        const DietPlan = (await import('@/models/DietPlan')).default;

        // Cleanup all associated data
        await Promise.all([
            FollowUp.deleteMany({ clientId: id }),
            DietPlan.deleteMany({ clientId: id }),
            Client.findByIdAndDelete(id)
        ]);

        return NextResponse.json({ message: 'Client and all associated records permanently deleted' });
    } catch (error: any) {
        console.error('Delete client error:', error);
        return NextResponse.json({
            error: 'Failed to delete client',
            details: error.message
        }, { status: 500 });
    }
}

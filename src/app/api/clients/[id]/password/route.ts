import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await params;

    try {
        // 1. Verify Auth
        const currentUser = await getAuthUser(req);
        if (!currentUser || currentUser.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { password } = await req.json();
        if (!password || password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // 2. Find Client
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Optional: Verify Dietician owns this client
        if (client.dieticianId.toString() !== currentUser._id.toString()) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (!client.userId) {
            return NextResponse.json(
                { error: 'Client does not have a linked user account' },
                { status: 400 }
            );
        }

        // 3. Update User Password
        const user = await User.findById(client.userId);
        if (!user) {
            return NextResponse.json({ error: 'User account not found' }, { status: 404 });
        }

        user.password = password; // User model's pre-save middleware will hash this
        await user.save();

        return NextResponse.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}

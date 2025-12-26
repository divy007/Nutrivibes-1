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
        return NextResponse.json(client);
    } catch {
        return NextResponse.json({ error: 'Failed to update client' }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    try {
        // Find the client first to get the userId
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Delete the client record
        await Client.findByIdAndDelete(id);

        // Delete the associated user account
        // This prevents the client from logging in with the same credentials
        const User = (await import('@/models/User')).default;
        await User.findByIdAndDelete(client.userId);

        return NextResponse.json({ message: 'Client and associated user account deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}

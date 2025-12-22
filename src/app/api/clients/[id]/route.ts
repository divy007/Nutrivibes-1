import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const client = await Client.findById(params.id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }
        return NextResponse.json(client);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const body = await req.json();
        const client = await Client.findByIdAndUpdate(params.id, body, {
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const client = await Client.findByIdAndDelete(params.id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Client deleted' });
    } catch {
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
    }
}

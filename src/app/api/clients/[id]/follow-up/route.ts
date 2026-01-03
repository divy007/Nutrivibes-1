import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    try {
        const { notes } = await req.json();

        const client = await Client.findByIdAndUpdate(
            id,
            {
                $push: {
                    followUpHistory: {
                        date: new Date(),
                        notes,
                        updatedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client.followUpHistory[client.followUpHistory.length - 1]);
    } catch (error) {
        console.error('Failed to add follow-up note:', error);
        return NextResponse.json({ error: 'Failed to add follow-up note' }, { status: 500 });
    }
}

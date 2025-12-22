import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';

export async function GET() {
    await dbConnect();
    try {
        const clients = await Client.find({}).populate('dieticianId', 'name email');
        return NextResponse.json(clients);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const client = await Client.create(body);
        return NextResponse.json(client, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create client' }, { status: 400 });
    }
}

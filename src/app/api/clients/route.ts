import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';

export async function GET() {
    await dbConnect();
    try {
        const clients = await Client.find({}).populate('dieticianId', 'name email');
        return NextResponse.json(clients);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

// ... existing GET handler ...

export async function POST(req: Request) {
    await dbConnect();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, password, ...clientData } = body;

        // 1. Check if User/Email exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        // 2. Check if Phone exists (if provided)
        if (clientData.phone) {
            const existingClient = await Client.findOne({ phone: clientData.phone });
            if (existingClient) {
                return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
            }
        }

        // 3. Create User for Login
        const newUser = await User.create({
            name,
            email,
            password, // User model handles hashing
            role: 'CLIENT',
        });

        // 3. Create Client Profile
        const client = await Client.create({
            ...clientData,
            name,
            email,
            userId: newUser._id,
            dieticianId: user._id,
        });

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error('Create client error:', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}

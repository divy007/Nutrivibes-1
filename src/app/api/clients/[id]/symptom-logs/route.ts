import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import SymptomLog from '@/models/SymptomLog';
import { getAuthUser } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    try {
        const { id } = await params;
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        const logs = await SymptomLog.find({ clientId: client._id }).sort({ date: -1 }).limit(30);
        return NextResponse.json(logs);
    } catch (error) {
        console.error('Failed to fetch symptom logs:', error);
        return NextResponse.json({ error: 'Failed to fetch symptom logs' }, { status: 500 });
    }
}

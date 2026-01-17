import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import HealthAssessment from '@/models/HealthAssessment';
import Client from '@/models/Client';

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        // Verify client exists (optional but good for 404)
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Fetch latest assessment
        const latestAssessment = await HealthAssessment.findOne({ clientId: id })
            .sort({ date: -1 });

        // If no assessment found, return null or empty (frontend handles it)
        // Returning null is fine, or we can return { assessment: null }
        // The frontend expects the assessment object directly or null
        return NextResponse.json(latestAssessment);
    } catch (error) {
        console.error('Failed to fetch health assessment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import HealthAssessment from '@/models/HealthAssessment';
import Client from '@/models/Client';

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const client = await Client.findOne({ userId: user._id });
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const latestAssessment = await HealthAssessment.findOne({ clientId: client._id })
            .sort({ date: -1 });

        return NextResponse.json(latestAssessment);
    } catch (error) {
        console.error('Failed to fetch health assessment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { answers, categoryScores, totalScore, riskLevel } = body;

        await connectDB();

        // IMPORTANT: We need the Client ID, not the User ID
        const client = await Client.findOne({ userId: user._id });
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const assessment = await HealthAssessment.create({
            clientId: client._id,
            date: new Date(),
            answers,
            categoryScores,
            totalScore,
            riskLevel
        });

        return NextResponse.json(assessment);
    } catch (error) {
        console.error('Failed to save health assessment - FULL ERROR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to save health assessment',
            details: errorMessage
        }, { status: 500 });
    }
}

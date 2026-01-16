import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';

export async function GET() {
    return NextResponse.json({ error: 'Seeding is disabled for security. Enable explicitly in code to run.' }, { status: 403 });

    /* 
    // ENABLE ONLY WHEN NEEDED
    await connectDB();
    try {
        // ... (existing logic) ...
        return NextResponse.json({ message: 'Plans seeded successfully', count: plans.length });
    } catch (error) {
        console.error('Failed to seed plans:', error);
        return NextResponse.json({ error: 'Failed to seed plans' }, { status: 500 });
    }
    */
}

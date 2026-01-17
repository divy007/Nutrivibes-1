import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User'; // Direct import

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

        // Auto-calculate Ideal Weight if height is updated and idealWeight is missing
        if (body.height && !body.idealWeight) {
            const heightInM = body.height / 100;
            body.idealWeight = parseFloat((22 * heightInM * heightInM).toFixed(1));
        }

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
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Stage 1: If client is NOT already 'DELETED', perform soft delete
        if (client.status !== 'DELETED') {
            // Mark as DELETED
            await Client.findByIdAndUpdate(id, { $set: { status: 'DELETED' } });

            // Hard delete the associated user account to prevent login
            if (client.userId) {
                try {
                    await User.findByIdAndDelete(client.userId);
                    console.log(`Deleted associated user account: ${client.userId}`);
                } catch (userErr) {
                    console.error('Failed to delete associated user account:', userErr);
                }
            }
            return NextResponse.json({ message: 'Client marked as deleted and user account removed' });
        }

        // Stage 2: If client is ALREADY 'DELETED', perform PERMANENT removal
        const FollowUp = (await import('@/models/FollowUp')).default;
        const DietPlan = (await import('@/models/DietPlan')).default;
        const WeightLog = (await import('@/models/WeightLog')).default;
        const WaterIntake = (await import('@/models/WaterIntake')).default;
        const MeasurementLog = (await import('@/models/MeasurementLog')).default;
        const SymptomLog = (await import('@/models/SymptomLog')).default;
        const PeriodLog = (await import('@/models/PeriodLog')).default;
        const ActivityLog = (await import('@/models/ActivityLog')).default;
        // Added missing models
        const MealLog = (await import('@/models/MealLog')).default;
        const HealthAssessment = (await import('@/models/HealthAssessment')).default;
        const Subscription = (await import('@/models/Subscription')).default;

        // Cleanup all associated data
        await Promise.all([
            FollowUp.deleteMany({ clientId: id }),
            DietPlan.deleteMany({ clientId: id }),
            WeightLog.deleteMany({ clientId: id }),
            WaterIntake.deleteMany({ clientId: id }),
            MeasurementLog.deleteMany({ clientId: id }),
            SymptomLog.deleteMany({ clientId: id }),
            PeriodLog.deleteMany({ clientId: id }),
            ActivityLog.deleteMany({ clientId: id }),
            // Delete newly identified models
            MealLog.deleteMany({ clientId: id }),
            HealthAssessment.deleteMany({ clientId: id }),
            Subscription.deleteMany({ clientId: id }),

            Client.findByIdAndDelete(id)
        ]);

        // Ensure user is deleted if it wasn't before (for permanent delete)
        if (client.userId) {
            await User.findByIdAndDelete(client.userId).catch(() => { });
        }

        return NextResponse.json({ message: 'Client and all associated records permanently deleted' });
    } catch (error: any) {
        console.error('Delete client error:', error);
        return NextResponse.json({
            error: 'Failed to delete client',
            details: error.message
        }, { status: 500 });
    }
}

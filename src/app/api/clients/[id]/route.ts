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

        // Handle Advanced Recovery Logic
        if (body.recoverAction) {
            const currentClient = await Client.findById(id);
            if (currentClient) {
                if (body.recoverAction === 'RESTORE_PREVIOUS') {
                    // Restore to previous status if available, else default to ACTIVE
                    body.status = currentClient.previousStatus || 'ACTIVE';
                } else if (body.recoverAction === 'RESTORE_NEW') {
                    body.status = 'NEW';

                    // Cleanup old data for "Fresh Start"
                    const FollowUp = (await import('@/models/FollowUp')).default;
                    const DietPlan = (await import('@/models/DietPlan')).default;
                    const WeightLog = (await import('@/models/WeightLog')).default;
                    const WaterIntake = (await import('@/models/WaterIntake')).default;
                    const MeasurementLog = (await import('@/models/MeasurementLog')).default;
                    const SymptomLog = (await import('@/models/SymptomLog')).default;
                    const PeriodLog = (await import('@/models/PeriodLog')).default;
                    const ActivityLog = (await import('@/models/ActivityLog')).default;
                    const MealLog = (await import('@/models/MealLog')).default;
                    const HealthAssessment = (await import('@/models/HealthAssessment')).default;
                    const Subscription = (await import('@/models/Subscription')).default;

                    await Promise.all([
                        FollowUp.deleteMany({ clientId: id }),
                        DietPlan.deleteMany({ clientId: id }),
                        WeightLog.deleteMany({ clientId: id }),
                        WaterIntake.deleteMany({ clientId: id }),
                        MeasurementLog.deleteMany({ clientId: id }),
                        SymptomLog.deleteMany({ clientId: id }),
                        PeriodLog.deleteMany({ clientId: id }),
                        ActivityLog.deleteMany({ clientId: id }),
                        MealLog.deleteMany({ clientId: id }),
                        HealthAssessment.deleteMany({ clientId: id }),
                        Subscription.deleteMany({ clientId: id }),
                    ]);

                    // Reset client fields for new start
                    body.dietStartDate = null;
                    body.counselingDate = null;
                    body.isProfileComplete = false;
                    body.previousStatus = undefined;
                }
                // Clear separate recoverAction field before update to avoid schema error
                delete body.recoverAction;
            }
        }

        const client = await Client.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json(client);
    } catch (error: any) {
        console.error('Failed to update client:', error);
        return NextResponse.json({
            error: 'Failed to update client',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 });
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
            // Mark as DELETED and save previous status
            await Client.findByIdAndUpdate(id, {
                $set: {
                    status: 'DELETED',
                    previousStatus: client.status
                }
            });

            // CRITICAL: We do NOT delete the associated User account here.
            // This allows the Dietician to "Recover" the account later if needed,
            // enabling the client to log in with their existing credentials.

            return NextResponse.json({ message: 'Client marked as deleted. User account preserved for potential recovery.' });
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

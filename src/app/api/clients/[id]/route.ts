import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User'; // Direct import
import mongoose from 'mongoose';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    try {
        const client = await Client.findById(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }
        return NextResponse.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    try {
        let body: any = {};
        const contentType = req.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData();
            const file = formData.get('file') as File | null;
            const dataStr = formData.get('data') as string;

            if (dataStr) {
                try {
                    body = JSON.parse(dataStr);
                } catch (e) {
                    return NextResponse.json({ error: 'Invalid JSON data' }, { status: 400 });
                }
            }

            if (file) {
                const buffer = Buffer.from(await file.arrayBuffer());
                // Sanitize filename
                const filename = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;

                // Define upload path
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reports', id);

                // Ensure directory exists
                try {
                    await mkdir(uploadDir, { recursive: true });
                } catch (e) {
                    console.error('Error creating directory', e);
                }

                // Handle "Latest Only": Delete existing file if present in DB
                const currentClient = await Client.findById(id);
                if (currentClient?.counsellingProfile?.medicalReport) {
                    const oldPathRelative = currentClient.counsellingProfile.medicalReport;
                    if (oldPathRelative.startsWith('/uploads/reports/')) {
                        const oldPathAbsolute = path.join(process.cwd(), 'public', oldPathRelative);
                        try {
                            // Check if file exists before deleting
                            if (fs.existsSync(oldPathAbsolute)) {
                                await unlink(oldPathAbsolute);
                            }
                        } catch (e) {
                            console.warn('Failed to delete old report:', e);
                        }
                    }
                }

                // Write new file
                const filePath = path.join(uploadDir, filename);
                await writeFile(filePath, buffer);


                // Update body with new public path
                const publicPath = `/uploads/reports/${id}/${filename}`;

                if (body.counsellingProfile) {
                    // Full update scenario (from CounsellingFlow)
                    body.counsellingProfile.medicalReport = publicPath;
                } else {
                    // Partial update scenario (from Dashboard Upload)
                    body['counsellingProfile.medicalReport'] = publicPath;
                }
            }
        } else {
            body = await req.json();
        }

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

        // Subscription Creation Logic
        if (body.planId) {
            const Plan = (await import('@/models/Plan')).default;
            const Subscription = (await import('@/models/Subscription')).default;

            const selectedPlan = await Plan.findById(body.planId);
            if (!selectedPlan) {
                return NextResponse.json({ error: 'Selected plan not found' }, { status: 400 });
            }

            // Calculate dates
            const startDate = body.dietStartDate ? new Date(body.dietStartDate) : new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + selectedPlan.durationMonths);

            // Deactivate existing active subscriptions
            await Subscription.updateMany(
                { clientId: id, status: 'ACTIVE' },
                { $set: { status: 'EXPIRED' } }
            );

            // Create new subscription
            await Subscription.create({
                clientId: id,
                planId: body.planId,
                startDate,
                endDate,
                price: selectedPlan.price,
                status: 'ACTIVE',
                features: selectedPlan.features,
                consultations: selectedPlan.consultations
            });

            body.status = 'ACTIVE';
            delete body.planId; // Remove from body as it's not in Client schema
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

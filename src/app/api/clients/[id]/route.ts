import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User'; // Direct import
import mongoose from 'mongoose';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

import { getAuthUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
        return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    try {
        // A01: Broken Access Control Fix
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const Subscription = (await import('@/models/Subscription')).default;
        const Plan = (await import('@/models/Plan')).default;

        const client = await Client.findById(id).lean();
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Authorization Check
        if (user.role === 'CLIENT') {
            // Ensure client is accessing their own data
            if (client.userId && client.userId.toString() !== user._id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } else if (user.role !== 'DIETICIAN') {
            // Only Clients and Dieticians allowed
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch active subscription (ASSIGNED, ACTIVE, or PAUSED)
        const today = new Date();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const activeSubscription = await Subscription.findOne({
            clientId: id as any,
            status: { $in: ['ASSIGNED', 'ACTIVE', 'PAUSED'] }
        }).sort({ createdAt: -1 }).populate('planId').lean();

        return NextResponse.json({
            ...client,
            activeSubscription
        });
    } catch (error: any) {
        console.error('Error fetching client:', error);
        // A05: Security Misconfiguration (Stack Trace Exposure)
        // Ensure we don't leak stack traces in production
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
                        Subscription.deleteMany({ clientId: id as any }),
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

        // Diet Start Date Change → Recalculate Subscription Dates
        if (body.dietStartDate && !body.planId && !body.recoverAction) {
            const Subscription = (await import('@/models/Subscription')).default;
            const Plan = (await import('@/models/Plan')).default;

            const activeSubscription = await Subscription.findOne({
                clientId: id as any,
                status: { $in: ['ASSIGNED', 'ACTIVE', 'PAUSED'] }
            }).sort({ createdAt: -1 });

            if (activeSubscription && activeSubscription.planId) {
                const plan = await Plan.findById(activeSubscription.planId);
                if (plan) {
                    const newStart = new Date(body.dietStartDate);
                    const durationDays = plan.durationMonths * 30;
                    const newEnd = new Date(newStart);
                    newEnd.setDate(newEnd.getDate() + durationDays);

                    const currentClient = await Client.findById(id);
                    if (currentClient && currentClient.pendingReferralDays > 0) {
                        const pendingDays = currentClient.pendingReferralDays;
                        console.log(`[Client PATCH] Applying ${pendingDays} pending referral days during activation`);
                        newEnd.setDate(newEnd.getDate() + pendingDays);
                        
                        if (!currentClient.referralRewards) {
                            currentClient.referralRewards = [];
                        }
                        currentClient.referralRewards.push({
                            date: new Date(),
                            daysEarned: pendingDays,
                            fromClientId: currentClient._id,
                            note: `Redeemed ${pendingDays} pending referral days upon subscription activation (diet start)`
                        });
                        currentClient.pendingReferralDays = 0;
                        await currentClient.save();
                    }

                    activeSubscription.startDate = newStart;
                    activeSubscription.endDate = newEnd;
                    // Activate if it was pending (placeholder 2099 date)
                    if (activeSubscription.status === 'ASSIGNED') {
                        activeSubscription.status = 'ACTIVE';
                    }
                    await activeSubscription.save();
                    console.log('[Client PATCH] Subscription dates recalculated for new dietStartDate:', body.dietStartDate);
                }
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

            const currentClient = await Client.findById(id);
            if (currentClient && currentClient.pendingReferralDays > 0 && endDate.getFullYear() < 2099) {
                const pendingDays = currentClient.pendingReferralDays;
                console.log(`[Client PATCH] Applying ${pendingDays} pending referral days during plan assignment`);
                endDate.setDate(endDate.getDate() + pendingDays);
                
                if (!currentClient.referralRewards) {
                    currentClient.referralRewards = [];
                }
                currentClient.referralRewards.push({
                    date: new Date(),
                    daysEarned: pendingDays,
                    fromClientId: currentClient._id,
                    note: `Redeemed ${pendingDays} pending referral days upon subscription assignment`
                });
                currentClient.pendingReferralDays = 0;
                await currentClient.save();
            }

            // Find existing subscription for this client
            const existingSubscription = await Subscription.findOne({ clientId: id as any });

            if (existingSubscription) {
                // UPDATE existing subscription
                existingSubscription.planId = body.planId;
                existingSubscription.planName = selectedPlan.name;
                existingSubscription.startDate = startDate;
                existingSubscription.endDate = endDate;
                existingSubscription.totalAmount = selectedPlan.price;
                existingSubscription.status = 'ACTIVE';

                // Add to plan history
                existingSubscription.planHistory.push({
                    changedAt: new Date(),
                    action: 'ASSIGN',
                    oldPlanId: existingSubscription.planId,
                    newPlanId: body.planId,
                    oldPlanName: existingSubscription.planName,
                    newPlanName: selectedPlan.name,
                    oldAmount: existingSubscription.totalAmount,
                    newAmount: selectedPlan.price
                });

                await existingSubscription.save();
            } else {
                // CREATE new subscription (first time)
                await Subscription.create({
                    clientId: id as any,
                    planId: body.planId,
                    planName: selectedPlan.name,
                    startDate,
                    endDate,
                    totalAmount: selectedPlan.price,
                    amountPaid: 0,
                    status: 'ACTIVE',
                    paymentHistory: [],
                    planHistory: [{
                        changedAt: new Date(),
                        action: 'ASSIGN',
                        newPlanId: body.planId,
                        newPlanName: selectedPlan.name,
                        newAmount: selectedPlan.price
                    }]
                });
            }

            body.status = 'ACTIVE';
            delete body.planId; // Remove from body as it's not in Client schema

            // Referral Reward Trigger
            const { processReferralReward } = await import('@/lib/referral');
            await processReferralReward(id, selectedPlan.durationMonths);
        }

        // Synchronize Active Subscription Status
        const currentClientForSync = await Client.findById(id);
        if (currentClientForSync && body.status && body.status !== currentClientForSync.status) {
            const Subscription = (await import('@/models/Subscription')).default;
            const activeSub = await Subscription.findOne({
                clientId: id as any,
                status: { $in: ['ACTIVE', 'PAUSED'] }
            });

            if (activeSub) {
                const today = new Date();
                const { differenceInDays, addDays } = await import('date-fns');

                if (body.status === 'PAUSED' && body.pausedUntil) {
                    // Changing to PAUSED with specific pausedUntil date
                    activeSub.status = 'PAUSED';
                    if (!activeSub.pauseHistory) {
                        activeSub.pauseHistory = [];
                    }
                    activeSub.pauseHistory.push({
                        startDate: today,
                        endDate: new Date(body.pausedUntil),
                        reason: 'Client paused by dietician'
                    });

                    // Calculate duration and extend endDate
                    const duration = Math.max(1, differenceInDays(new Date(body.pausedUntil), today));
                    activeSub.pauseDaysUsed = (activeSub.pauseDaysUsed || 0) + duration;
                    activeSub.endDate = addDays(new Date(activeSub.endDate), duration);
                    await activeSub.save();
                } else if (body.status === 'ACTIVE' && currentClientForSync.status === 'PAUSED') {
                    // Resuming to ACTIVE from PAUSED
                    activeSub.status = 'ACTIVE';

                    // Find active pause entry and set its endDate
                    const activePause = activeSub.pauseHistory?.find((h: any) => !h.endDate || new Date(h.endDate) > today);
                    if (activePause) {
                        const originalEndDate = activePause.endDate ? new Date(activePause.endDate) : null;
                        activePause.endDate = today;

                        if (originalEndDate && originalEndDate > today) {
                            // Paused for fixed duration but resumed early!
                            const approvedDuration = differenceInDays(originalEndDate, new Date(activePause.startDate));
                            const actualDuration = Math.max(1, differenceInDays(today, new Date(activePause.startDate)));
                            const earlyResumeDays = approvedDuration - actualDuration;

                            if (earlyResumeDays > 0) {
                                activeSub.pauseDaysUsed = Math.max(0, (activeSub.pauseDaysUsed || 0) - earlyResumeDays);
                                activeSub.endDate = addDays(new Date(activeSub.endDate), -earlyResumeDays);
                            }
                        } else if (!originalEndDate) {
                            // Indefinite manual pause - extend endDate by actual duration now
                            const duration = Math.max(1, differenceInDays(today, new Date(activePause.startDate)));
                            activeSub.pauseDaysUsed = (activeSub.pauseDaysUsed || 0) + duration;
                            activeSub.endDate = addDays(new Date(activeSub.endDate), duration);
                        }
                    }
                    await activeSub.save();
                }
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
        console.error('Failed to update client:', JSON.stringify(error, null, 2)); // Log full structure

        // Mongoose Validation Error Support
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
            return NextResponse.json({
                error: `Validation Failed: ${messages}`,
                details: error
            }, { status: 400 });
        }

        return NextResponse.json({
            error: 'Failed to update client',
            details: error instanceof Error ? error.message : JSON.stringify(error)
        }, { status: 500 }); // Changed to 500 for better visibility if it's not a bad request
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
            Subscription.deleteMany({ clientId: id as any }),

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

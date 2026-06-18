
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User';
import WeightLog from '@/models/WeightLog';
import MeasurementLog from '@/models/MeasurementLog';
import DietPlan from '@/models/DietPlan';
import { getAuthUser } from '@/lib/auth';
import { generateToken } from '@/lib/auth';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'This app is for Clients only. Please login with a Client account.' }, { status: 403 });
        }

        let client = await Client.findOne({ userId: user._id });

        if (!client && user.phone) {
            client = await Client.findOne({ phone: user.phone });
            if (client) {
                client.userId = user._id;
                await client.save();
            }
        }

        if (!client) {
            return NextResponse.json({
                userId: user._id,
                name: user.name || 'App User',
                phone: user.phone,
                email: user.email,
                isProfileComplete: false,
                isNewUser: true
            });
        }

        if (client.status === 'DELETED') {
            return NextResponse.json({ error: 'Your account has been deleted. Please contact your dietician to recover it.' }, { status: 403 });
        }

        if (client && !client.isProfileComplete) {
            const hasAllFields = !!(
                (client.pincode || client.address) &&
                client.dob &&
                client.gender &&
                client.height &&
                client.weight &&
                client.primaryGoal && client.primaryGoal.length > 0
            );

            if (hasAllFields) {
                client.isProfileComplete = true;
                await client.save();
            }
        }

        await import('@/models/Plan');
        const { syncClientSubscription } = await import('@/lib/subscription-sync');
        let activeSub = await syncClientSubscription(client._id);

        if (activeSub) {
            const Subscription = (await import('@/models/Subscription')).default;
            const sub = await Subscription.findById(activeSub._id).populate('planId');
            if (sub) {
                activeSub = sub;
                client.status = sub.status;
            }
        }

        // Fetch Referrals
        const myReferrals = await Client.find({ referredBy: client._id })
            .select('name phone status referralStatus createdAt')
            .sort({ createdAt: -1 });

        const finalActiveSubscription = activeSub ? activeSub.toObject() : null;

        return NextResponse.json({
            ...client.toObject(),
            activeSubscription: finalActiveSubscription,
            myReferrals
        });
    } catch (error: any) {
        console.error('Failed to fetch client profile:', error);
        return NextResponse.json({ error: `Failed to fetch profile: ${error.message}` }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        let client = await Client.findOne({ userId: user._id });

        if (!client && user.phone) {
            client = await Client.findOne({ phone: user.phone });
            if (client) {
                client.userId = user._id;
                if (['DELETED', 'LEAD'].includes(client.status)) {
                    client.status = 'LEAD';
                    client.dietStartDate = undefined;
                    await DietPlan.deleteMany({ clientId: client._id });
                }
                await client.save();
            }
        }

        if (!client) {
            const defaultDietician = await User.findOne({ role: 'DIETICIAN' });
            if (!defaultDietician) {
                return NextResponse.json({ error: 'No dietician available for assignment' }, { status: 500 });
            }

            client = new Client({
                userId: user._id,
                dieticianId: defaultDietician._id,
                name: body.name || user.name || 'App User',
                email: body.email || user.email,
                phone: user.phone,
                status: 'LEAD',
                registrationSource: 'MOBILE_APP',
                isProfileComplete: false
            });
            await client.save();
        }

        const { name, email, phone, userId, dieticianId, _id, ...updateFields } = body;

        // Check if reset is needed (if weight or height changed)
        const weightChanged = updateFields.weight !== undefined && updateFields.weight !== client.weight;
        const heightChanged = updateFields.height !== undefined && updateFields.height !== client.height;

        if (weightChanged || heightChanged) {
            console.log(`Resetting progress for client ${client._id} due to ${weightChanged ? 'weight' : ''} ${heightChanged ? 'height' : ''} update`);
            await WeightLog.deleteMany({ clientId: client._id });
            await MeasurementLog.deleteMany({ clientId: client._id });
        }

        const isProfileComplete = !!(
            (updateFields.pincode || client.pincode) &&
            (updateFields.dob || client.dob) &&
            (updateFields.gender || client.gender) &&
            (updateFields.height || client.height) &&
            (updateFields.weight || client.weight) &&
            (updateFields.primaryGoal || (client.primaryGoal && client.primaryGoal.length > 0))
        );

        if (updateFields.dob) {
            const dobDate = new Date(updateFields.dob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const m = today.getMonth() - dobDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
            updateFields.age = age;
        }

        let idealWeight = updateFields.idealWeight;
        if (!idealWeight && updateFields.height) {
            const heightInM = updateFields.height / 100;
            idealWeight = parseFloat((22 * heightInM * heightInM).toFixed(1));
        }

        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] === undefined || updateFields[key] === null || updateFields[key] === '') {
                delete updateFields[key];
            }
        });

        const updateData = {
            ...updateFields,
            isProfileComplete,
            idealWeight,
            name: body.name || client.name,
        };

        const updatedClient = await Client.findOneAndUpdate(
            { _id: client._id },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!updatedClient) {
            console.error('Client profile not found during update:', client._id);
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        client = updatedClient;

        if (updateFields.weight) {
            try {
                await WeightLog.create({
                    clientId: client._id,
                    weight: updateFields.weight,
                    unit: 'kg',
                    date: new Date()
                });
            } catch (logError) {
                console.error('Failed to auto-create weight log during profile update:', logError);
            }
        }

        const newToken = generateToken(user, isProfileComplete);
        const response = NextResponse.json(client);

        response.cookies.set('token_client', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        response.headers.set('X-New-Token', newToken);

        return response;
    } catch (error: any) {
        console.error('Failed to update client profile - Full error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: `Update failed: ${errorMessage}`,
            details: errorMessage
        }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findOne({ userId: user._id }).select('+referralRewards');
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        client.status = 'DELETED';
        await client.save();

        const response = NextResponse.json({ message: 'Account deleted successfully' });

        response.cookies.set('token_client', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });

        return response;
    } catch (error: any) {
        console.error('Failed to delete client account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}

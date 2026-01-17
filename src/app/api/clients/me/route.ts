import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User';
import WeightLog from '@/models/WeightLog';
import { getAuthUser } from '@/lib/auth';
import { generateToken } from '@/lib/auth';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let client = await Client.findOne({ userId: user._id });

        // SELF-HEALING: If no client by userId, try finding by phone (orphaned record)
        if (!client && user.phone) {
            client = await Client.findOne({ phone: user.phone });
            if (client) {
                console.log('Found orphaned client record by phone, claiming it for user:', user._id);
                client.userId = user._id;
                // If it was deleted, move it back to LEAD so it shows up in dashboard
                if (client.status === 'DELETED') {
                    client.status = 'LEAD';
                }
                await client.save();
            }
        }

        if (!client) {
            // Return skeleton profile for new phone-auth users
            return NextResponse.json({
                userId: user._id,
                name: user.name || 'App User',
                phone: user.phone,
                email: user.email,
                isProfileComplete: false,
                isNewUser: true
            });
        }

        // SELF-HEALING: If client is marked DELETED (soft delete) but managed to login (user still exists),
        // we recover them to LEAD status so they are visible to the Dietician again.
        if (client.status === 'DELETED') {
            console.log('Recovering soft-deleted client for active user:', user._id);
            client.status = 'LEAD';
            await client.save();
        }

        return NextResponse.json(client);
    } catch (error) {
        console.error('Failed to fetch client profile:', error);
        return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
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
        console.log('Update request body:', body);

        let client = await Client.findOne({ userId: user._id });

        // SELF-HEALING: If no client by userId, try finding by phone (orphaned record)
        if (!client && user.phone) {
            client = await Client.findOne({ phone: user.phone });
            if (client) {
                console.log('Found orphaned client record by phone during PATCH, claiming it:', user._id);
                client.userId = user._id;
                // Important: Don't change status to LEAD yet if it's already ACTIVE/NEW, 
                // but if it was DELETED/LEAD, ensure it's LEAD for conversion.
                if (['DELETED', 'LEAD'].includes(client.status)) {
                    client.status = 'LEAD';
                }
                await client.save();
            }
        }

        if (!client) {
            // New user scenario: Create the Client record
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

        // Extract only the fields that should be updated (exclude read-only fields)
        const { name, email, phone, userId, dieticianId, _id, ...updateFields } = body;

        // Check if all required fields are filled to mark profile as complete
        const isProfileComplete = !!(
            updateFields.city &&
            updateFields.dob &&
            updateFields.gender &&
            updateFields.height &&
            updateFields.weight &&
            updateFields.primaryGoal
        );

        // Auto-calculate Ideal Weight (Target Weight) using BMI 22 if height is changed/present
        let idealWeight = updateFields.idealWeight;
        if (!idealWeight && updateFields.height) {
            const heightInM = updateFields.height / 100;
            // BMI 22 is generally considered the middle of healthy range
            idealWeight = parseFloat((22 * heightInM * heightInM).toFixed(1));
        }

        const updateData = {
            ...updateFields,
            isProfileComplete,
            idealWeight,
            name: body.name || client.name, // Allow updating name
        };

        const updatedClient = await Client.findOneAndUpdate(
            { _id: client._id }, // Use actual ID since we just claimed/found it
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

        // AUTO-LOG WEIGHT: If weight was updated in the profile, create a history log
        if (updateFields.weight) {
            try {
                await WeightLog.create({
                    clientId: client._id,
                    weight: updateFields.weight,
                    unit: 'kg', // Defaulting to kg as per schema
                    date: new Date()
                });
            } catch (logError) {
                console.error('Failed to auto-create weight log during profile update:', logError);
            }
        }

        // Generate new token with updated isProfileComplete status
        const newToken = generateToken(user, isProfileComplete);

        const response = NextResponse.json(client);

        // Update the token cookie
        response.cookies.set('token_client', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        // Also send the new token in the response for client-side storage
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

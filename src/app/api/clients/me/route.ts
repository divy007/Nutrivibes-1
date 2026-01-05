import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WeightLog from '@/models/WeightLog';
import { getAuthUser } from '@/lib/auth';
import { generateToken } from '@/lib/auth';

export async function GET(req: Request) {
    console.log('GET /api/clients/me hit');
    await connectDB();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findOne({ userId: user._id });
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
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

        // Extract only the fields that should be updated (exclude read-only fields)
        const { name, email, phone, userId, dieticianId, _id, ...updateFields } = body;

        // Check if all required fields are filled to mark profile as complete
        const isProfileComplete = !!(
            updateFields.city &&
            updateFields.state &&
            updateFields.dob &&
            updateFields.gender &&
            updateFields.height &&
            updateFields.weight
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
        };

        console.log('Updating client with data:', updateData);

        const client = await Client.findOneAndUpdate(
            { userId: user._id },
            { $set: updateData },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!client) {
            console.error('Client profile not found for userId:', user._id);
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

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
                // Non-blocking error
            }
        }

        console.log('Client updated successfully:', client._id);

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
    } catch (error) {
        console.error('Failed to update client profile - Full error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: 'Failed to update profile',
            details: errorMessage
        }, { status: 400 });
    }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import User from '@/models/User';
import mongoose from 'mongoose';
import { normalizePhoneNumber } from '@/lib/phone-utils';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, phone: rawPhone, referredByClientId } = await req.json();
        const phone = rawPhone ? normalizePhoneNumber(rawPhone) : '';

        if (!name || !phone || !referredByClientId) {
            return NextResponse.json(
                { error: 'Name, phone and referrer ID are required' },
                { status: 400 }
            );
        }

        if (!mongoose.isValidObjectId(referredByClientId)) {
            return NextResponse.json({ error: 'Invalid referrer ID' }, { status: 400 });
        }

        // 1. Verify Referrer exists
        const referrer = await Client.findById(referredByClientId);
        if (!referrer) {
            return NextResponse.json({ error: 'Referrer not found' }, { status: 404 });
        }

        // 2. Check if lead already exists (by phone)
        const existingClient = await Client.findOne({ phone });
        if (existingClient) {
            return NextResponse.json(
                { error: 'A client with this phone number already exists' },
                { status: 409 }
            );
        }

        // 3. Find a Dietician to assign (Default to the referrer's dietician, or specific default)
        // Ideally, assign to the same dietician as the referrer
        const dieticianId = referrer.dieticianId;

        // Fallback if referrer has no dietician (unlikely for active client)
        if (!dieticianId) {
            return NextResponse.json({ error: 'Referrer is not assigned to a dietician' }, { status: 500 });
        }

        // We need a userId for the Client. Since this is just a LEAD from a referral, 
        // we might not have a real User account yet.
        // However, the Schema requires `userId`.
        // Strategy: Create a placeholder User or make userId optional in Schema?
        // Looking at Schema: `userId` IS required.
        // So we must create a User account for this Lead.

        // Generate a placeholder email since it's required unique in User model (usually)
        // User model: email is required? Let's assume yes from previous `register` route.
        // We'll use a dummy email like `phone@placeholder.com` or similar if real email not provided.
        const dummyEmail = `${phone}@referral.placeholder`;

        // Create User
        const newUser = await User.create({
            name: name,
            email: dummyEmail,
            password: 'temp_password_' + Date.now(), // Random password, they can't login yet
            phone: phone,
            role: 'CLIENT',
            loginMethod: 'EMAIL_PASSWORD'
        });

        // 4. Create the Lead
        const newClient = await Client.create({
            name,
            phone,
            email: dummyEmail,
            userId: newUser._id,
            dieticianId: dieticianId,
            registrationSource: 'MOBILE_APP',
            status: 'LEAD',
            isProfileComplete: false,
            referredBy: referrer._id,
            referralStatus: 'PENDING'
        });

        return NextResponse.json({
            success: true,
            message: 'Referral submitted successfully',
            client: {
                name: newClient.name,
                phone: newClient.phone,
                status: newClient.status
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Referral API Error:', error);
        // Duplicate key error
        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'Client with this phone/email already exists' },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

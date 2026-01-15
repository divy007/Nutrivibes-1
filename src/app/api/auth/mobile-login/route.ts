import { NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Client from '@/models/Client';
import { generateToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { idToken } = await req.json();

        if (!idToken) {
            return NextResponse.json({ error: 'ID Token required' }, { status: 400 });
        }

        // 1. Verify Firebase Token
        let decodedToken;
        try {
            decodedToken = await verifyIdToken(idToken);
        } catch (error: any) {
            console.error('Firebase token verification failed:', error.message);
            return NextResponse.json({
                error: 'Invalid token',
                details: error.message
            }, { status: 401 });
        }

        const { uid, phone_number } = decodedToken;
        console.log('Decoded Token:', { uid, phone_number, allClaims: decodedToken });

        if (!phone_number) {
            return NextResponse.json({ error: 'Phone number not found in token' }, { status: 400 });
        }

        await connectDB();

        // 2. Find or Create User
        // Check by Phone Number (most reliable link)
        let user = await User.findOne({ phone: phone_number });

        if (user) {
            // Link Firebase UID if not present
            if (!user.firebaseUid) {
                user.firebaseUid = uid;
                await user.save();
            }
        } else {
            // Check if account exists with email, etc? No, phone is primary here.

            // Create New User
            user = await User.create({
                name: 'App User', // Placeholder, updated later
                phone: phone_number,
                role: 'CLIENT',
                loginMethod: 'PHONE_OTP',
                firebaseUid: uid
            });
        }

        // 3. Check/Create Client Profile
        let client = await Client.findOne({ userId: user._id });

        if (!client) {
            // If User existed but Client didn't (rare edge case or manual DB entry)
            // Or if it's a completely new user

            // We need to link to a Dietician. 
            // Ideally: 'Unassigned' or a Default Dietician.
            // For now: We might return a 'New User' flag or assign to a default Dietician if one exists?
            // Or just create a partial profile without Dietician? Schema requires DieticianId.

            // STRATEGY: 
            // If we don't have a Dietician to assign, we can't create a Client Record yet.
            // OR we create a "Lead" record.
            // BUT `Client` model requires `dieticianId`.

            // WORKAROUND: For now, if no Client profile, we return `isNewUser: true` in token/response?
            // But valid JWT needs User.

            // Let's assume we just return JWT. The App checks `isProfileComplete`.
        }

        const isProfileComplete = client?.isProfileComplete || false;

        // 4. Generate App JWT
        const token = generateToken(user, isProfileComplete);

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role,
                phone: user.phone,
                email: user.email
            },
            isProfileComplete
        });

    } catch (error: any) {
        console.error('Mobile login error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            message: error.message
        }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Client from '@/models/Client';

export async function GET() {
    await connectDB();

    try {
        const dieticianEmail = 'dietician@nutrivibes.com';
        const clientEmail = 'client@nutrivibes.com';
        const password = 'password123';

        // 1. Create Dietician
        let dietician = await User.findOne({ email: dieticianEmail });
        if (!dietician) {
            dietician = await User.create({
                name: 'Test Dietician',
                email: dieticianEmail,
                password: password,
                role: 'DIETICIAN',
            });
            console.log('Dietician created');
        }

        // 2. Create Client User (for Login)
        let clientUser = await User.findOne({ email: clientEmail });
        if (!clientUser) {
            clientUser = await User.create({
                name: 'Test Client',
                email: clientEmail,
                password: password,
                role: 'CLIENT',
            });
            console.log('Client User created');
        }

        // 3. Create Client Profile (Optional, linked to Dietician)
        // Check if profile exists using email
        const clientProfile = await Client.findOne({ email: clientEmail });
        if (!clientProfile && dietician) {
            await Client.create({
                name: 'Test Client',
                email: clientEmail,
                dieticianId: dietician._id,
                status: 'active',
            });
            console.log('Client Profile created');
        }

        return NextResponse.json({
            message: 'Seed successful',
            users: [
                { email: dieticianEmail, role: 'DIETICIAN', password },
                { email: clientEmail, role: 'CLIENT', password },
            ],
        });
    } catch (error) {
        console.error('Seed error:', error);
        return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
    }
}

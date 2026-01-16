import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import User from '@/models/User';
import { normalizeDateUTC } from '@/lib/date-utils';
import { addDays, format } from 'date-fns';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clients = await Client.find({ dieticianId: user._id }).lean();

        const today = normalizeDateUTC();
        const tomorrow = addDays(today, 1);
        const dayAfterTomorrow = addDays(today, 2);

        const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
        const targetDates = [formatDate(today), formatDate(tomorrow), formatDate(dayAfterTomorrow)];

        const enhancedClients = await Promise.all(clients.map(async (client: any) => {
            // Find diet plans that might contain our target dates
            // We search for plans where at least one day matches our needs
            const DietPlan = (await import('@/models/DietPlan')).default;
            const plans = await DietPlan.find({
                clientId: client._id,
                'days.date': {
                    $gte: addDays(today, -7),
                    $lte: addDays(today, 14)
                }
            }).lean();





            const isPublished = (dateStr: string) => {
                return plans.some((plan: any) =>
                    plan.days.some((day: any) => {
                        // Format the plan date and compare with the target date string
                        const planDateStr = formatDate(normalizeDateUTC(day.date));
                        return planDateStr === dateStr && day.status === 'PUBLISHED';
                    })
                );
            };

            const publishedToday = isPublished(targetDates[0]);
            const publishedTomorrow = isPublished(targetDates[1]);
            const publishedLater = isPublished(targetDates[2]);





            let dietStatus = 'black';
            if (!publishedToday) {
                dietStatus = 'black';
            } else if (publishedToday && publishedTomorrow && publishedLater) {
                dietStatus = 'green';
            } else if (publishedToday && publishedTomorrow) {
                dietStatus = 'yellow';
            } else if (publishedToday) {
                dietStatus = 'red';
            }

            // Check for Follow-Up Today
            const FollowUp = (await import('@/models/FollowUp')).default;
            const startOfDay = new Date(today);
            startOfDay.setUTCHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setUTCHours(23, 59, 59, 999);

            const followUpToday = await FollowUp.findOne({
                clientId: client._id,
                date: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                status: 'Pending'
            }).select('_id').lean();

            return {
                ...client,
                dietStatus,
                hasFollowUpToday: !!followUpToday
            };
        }));

        return NextResponse.json(enhancedClients);
    } catch (error) {
        console.error('Failed to fetch clients:', error);
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
    }
}

// ... existing GET handler ...

export async function POST(req: Request) {
    await dbConnect();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, email, password, phone, ...clientData } = body;

        // Validation: Require either Email or Phone
        if (!email && !phone) {
            return NextResponse.json({ error: 'Either Email or Phone number is required' }, { status: 400 });
        }

        // 1. Check if User/Email exists (if email provided)
        let linkedUser = null;
        if (email) {
            const existingUser = await User.findOne({ email: email.toLowerCase() });
            if (existingUser) {
                // Check if user already has a client profile
                const existingClient = await Client.findOne({ userId: existingUser._id });
                if (existingClient) {
                    return NextResponse.json({ error: 'Email already registered with a client profile' }, { status: 400 });
                }
                linkedUser = existingUser;
            }
        }

        // 2. Check if Phone exists (if provided)
        if (phone && !linkedUser) {
            const existingUserPhone = await User.findOne({ phone });
            if (existingUserPhone) {
                // Check if user already has a client profile
                const existingClient = await Client.findOne({ userId: existingUserPhone._id });
                if (existingClient) {
                    return NextResponse.json({ error: 'Phone number already registered with a client profile' }, { status: 400 });
                }
                linkedUser = existingUserPhone;
            }
        }

        let newUserId;
        if (linkedUser) {
            console.log('Linking existing User to new Client profile:', linkedUser._id);
            newUserId = linkedUser._id;

            // If user exists but was placeholder "App User" and we have a real name now, update it
            if (linkedUser.name === 'App User' && name) {
                linkedUser.name = name;
                await linkedUser.save();
            }
        } else {
            // 3. Create User for Login
            const userData: any = {
                name,
                role: 'CLIENT',
            };

            if (email) {
                userData.email = email;
                userData.loginMethod = 'EMAIL_PASSWORD';
                if (password) {
                    userData.password = password;
                } else {
                    return NextResponse.json({ error: 'Password is required with Email' }, { status: 400 });
                }
            }

            if (phone) {
                userData.phone = phone;
            }

            const newUser = await User.create(userData);
            newUserId = (newUser as any)._id || (newUser as any)[0]?._id;
        }

        // 4. Create Client Profile
        const clientDataCreate: any = {
            ...clientData,
            name,
            userId: newUserId,
            dieticianId: user._id,
            registrationSource: 'DIETICIAN',
        };

        if (email) clientDataCreate.email = email;
        if (phone) clientDataCreate.phone = phone;

        const client = await Client.create(clientDataCreate);

        // Trigger automatic follow-up generation if dietStartDate was provided
        if (clientData.dietStartDate) {
            try {
                const { generateFollowUps } = await import('@/lib/follow-up-utils');
                await generateFollowUps((client as any)._id.toString(), user._id.toString(), new Date(clientData.dietStartDate));
            } catch (err) {
                console.error('Failed to auto-generate follow-ups for new client:', err);
            }
        }

        return NextResponse.json(client, { status: 201 });
    } catch (error) {
        console.error('Create client error:', error);
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import Client from '@/models/Client';
import { getAuthUser } from '@/lib/auth';
import { subDays, startOfDay, endOfDay, addDays, format } from 'date-fns';
import { normalizeDateUTC } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const user = await getAuthUser(req);
        if (!user || user.role !== 'DIETICIAN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const dieticianId = user._id;

        // Run all independent counts and fetches in parallel
        const [
            activeCount,
            pausedCount,
            newCount,
            expiredCount,
            leadsCount,
            rawFollowUps,
            activeClients
        ] = await Promise.all([
            // 1. Active
            Client.countDocuments({ dieticianId, status: 'ACTIVE' }),
            // 2. Paused
            Client.countDocuments({ dieticianId, status: 'PAUSED' }),
            // 3. New (Last 7 days)
            Client.countDocuments({
                dieticianId,
                status: 'NEW',
                createdAt: { $gte: subDays(new Date(), 7) }
            }),
            // 4. Expired
            Client.countDocuments({ dieticianId, status: 'DELETED' }),
            // 5. Leads
            Client.countDocuments({ dieticianId, status: 'LEAD' }),
            // 6. Follow Ups
            (async () => {
                const FollowUp = (await import('@/models/FollowUp')).default;
                return FollowUp.find({
                    dieticianId,
                    status: 'Pending',
                    date: { $gte: startOfDay(new Date()), $lte: endOfDay(new Date()) }
                }).populate('clientId', 'name dietStatus status');
            })(),
            // 7. Active Clients (for Diet Pending Calc)
            Client.find({ dieticianId, status: 'ACTIVE' }).select('_id name').lean()
        ]);

        // Filter Follow-ups manually after parallel fetch
        const activeFollowUps = rawFollowUps.filter((fu: any) => fu.clientId && fu.clientId.status !== 'DELETED');

        // 8. Optimized Diet Pending Calculation (Batch Query)
        const todayUser = normalizeDateUTC();
        const tomorrow = addDays(todayUser, 1);
        const dayAfterTomorrow = addDays(todayUser, 2);
        const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
        const targetDates = [formatDate(todayUser), formatDate(tomorrow), formatDate(dayAfterTomorrow)];

        let redCount = 0;
        let yellowCount = 0;
        let blackCount = 0;
        const dietPendingList: any[] = [];

        if (activeClients.length > 0) {
            const DietPlan = (await import('@/models/DietPlan')).default;
            const activeClientIds = activeClients.map((c: any) => c._id);

            // Fetch ALL relevant plans in ONE query instead of N queries
            const allPlans = await DietPlan.find({
                clientId: { $in: activeClientIds },
                'days.date': {
                    $gte: addDays(todayUser, -7),
                    $lte: addDays(todayUser, 14)
                }
            }).select('clientId days.date days.status').lean();

            // Group plans by Client ID for O(1) lookup
            const plansByClient = new Map<string, any[]>();
            allPlans.forEach((plan: any) => {
                const cid = plan.clientId.toString();
                if (!plansByClient.has(cid)) plansByClient.set(cid, []);
                plansByClient.get(cid)?.push(plan);
            });

            // Calculate status for each client in memory
            activeClients.forEach((client: any) => {
                const clientPlans = plansByClient.get(client._id.toString()) || [];

                const isPublished = (dateStr: string) => {
                    return clientPlans.some((plan: any) =>
                        plan.days.some((day: any) => {
                            // Robust date matching
                            const planDateStr = formatDate(new Date(day.date));
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
                    blackCount++;
                } else if (publishedToday && publishedTomorrow && publishedLater) {
                    dietStatus = 'green';
                } else if (publishedToday && publishedTomorrow) {
                    dietStatus = 'yellow';
                    yellowCount++;
                } else if (publishedToday) {
                    dietStatus = 'red';
                    redCount++;
                }

                if (dietStatus !== 'green') {
                    dietPendingList.push({
                        name: client.name,
                        color: dietStatus === 'black' ? 'bg-black' : dietStatus === 'red' ? 'bg-rose-500' : 'bg-amber-500',
                        originalColor: dietStatus
                    });
                }
            });
        }

        // Sort pending list
        dietPendingList.sort((a, b) => {
            const priority: Record<string, number> = { black: 3, red: 2, yellow: 1 };
            return (priority[b.originalColor as string] || 0) - (priority[a.originalColor as string] || 0);
        });

        const dietPendingCount = redCount + yellowCount + blackCount;

        return NextResponse.json({
            activeClients: activeCount,
            newClients: newCount,
            pausedClients: pausedCount,
            expiredClients: expiredCount,
            leadsCount: leadsCount,
            todayFollowUps: activeFollowUps.map((fu: any) => ({
                name: fu.clientId?.name || 'Unknown Client',
                color: fu.clientId?.dietStatus ? (
                    fu.clientId.dietStatus === 'green' ? 'bg-emerald-500' :
                        fu.clientId.dietStatus === 'red' ? 'bg-rose-500' :
                            fu.clientId.dietStatus === 'black' ? 'bg-black' :
                                'bg-amber-500'
                ) : 'bg-slate-300'
            })),
            analysis: {
                dietPendingCount: dietPendingCount,
                dietPendingCounts: {
                    red: redCount,
                    yellow: yellowCount,
                    black: blackCount
                },
                dietPendingList: dietPendingList.slice(0, 10)
            }
        });
    } catch (error) {
        console.error('Failed to fetch dietician stats:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}

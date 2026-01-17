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

        // 1. Active Clients
        const activeCount = await Client.countDocuments({
            dieticianId,
            status: 'ACTIVE'
        });

        // 2. Paused Clients
        const pausedCount = await Client.countDocuments({
            dieticianId,
            status: 'PAUSED'
        });

        // 3. New Clients (Last 7 days)
        const sevenDaysAgo = subDays(new Date(), 7);
        const newCount = await Client.countDocuments({
            dieticianId,
            status: 'NEW',
            createdAt: { $gte: sevenDaysAgo }
        });

        // 4. Expired Clients (Soft Deleted)
        const expiredCount = await Client.countDocuments({
            dieticianId,
            status: 'DELETED'
        });

        // 5. Leads (Unconverted self-registered users)
        const leadsCount = await Client.countDocuments({
            dieticianId,
            status: 'LEAD'
        });

        // 6. Today's Follow Up (from FollowUp collection, Pending status)
        const FollowUp = (await import('@/models/FollowUp')).default;
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const followUps = await FollowUp.find({
            dieticianId,
            status: 'Pending',
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        }).populate('clientId', 'name dietStatus status');

        // Filter out follow-ups for DELETED clients
        const activeFollowUps = followUps.filter((fu: any) => fu.clientId && fu.clientId.status !== 'DELETED');



        // 8. Diet's Pending (Calculate Red/Yellow/Black)
        // Logic copied from clients/route.ts
        const activeClients = await Client.find({ dieticianId, status: 'ACTIVE' }).lean();
        const todayUser = normalizeDateUTC();
        const tomorrow = addDays(todayUser, 1);
        const dayAfterTomorrow = addDays(todayUser, 2);

        const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');
        const targetDates = [formatDate(todayUser), formatDate(tomorrow), formatDate(dayAfterTomorrow)];

        let redCount = 0;
        let yellowCount = 0;
        let blackCount = 0;
        const dietPendingList: any[] = [];

        // We need to fetch diet plans for all active clients to determine status
        // Optimization: Fetch all plans for these clients in one go or iterate.
        // Given complexity of nested days, iterating matching the original logic is safest for consistency.

        const DietPlan = (await import('@/models/DietPlan')).default;

        await Promise.all(activeClients.map(async (client: any) => {
            const plans = await DietPlan.find({
                clientId: client._id,
                'days.date': {
                    $gte: addDays(todayUser, -7),
                    $lte: addDays(todayUser, 14)
                }
            }).lean();

            const isPublished = (dateStr: string) => {
                return plans.some((plan: any) =>
                    plan.days.some((day: any) => {
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
                    originalColor: dietStatus // helpful for sorting if needed
                });
            }
        }));

        // Sort pending list by severity (Black > Red > Yellow)
        dietPendingList.sort((a, b) => {
            const priority = { black: 3, red: 2, yellow: 1 };
            return (priority[b.originalColor as keyof typeof priority] || 0) - (priority[a.originalColor as keyof typeof priority] || 0);
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
                dietPendingList: dietPendingList.slice(0, 10) // Limit list size
            }
        });
    } catch (error) {
        console.error('Failed to fetch dietician stats:', error);
        return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }
}

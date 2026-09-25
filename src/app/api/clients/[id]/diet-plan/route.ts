import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import { startOfWeek, format } from 'date-fns';
import { normalizeDateUTC, reanchorDietPlan } from '@/lib/date-utils';
import { syncDietPlanWithRecipes } from '@/lib/recipe-sync';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;

    // A01: Broken Access Control Fix
    const { getAuthUser } = await import('@/lib/auth');
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const Client = (await import('@/models/Client')).default;
    const client = await Client.findById(id);
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    if (user.role === 'CLIENT' && client.userId?.toString() !== user._id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else if (user.role !== 'DIETICIAN' && user.role !== 'CLIENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');

    try {
        const targetDate = normalizeDateUTC(startDate);
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 6);

        // 1. Find all plans that match targetDate or overlap with [targetDate, endDate]
        let matchingPlans = await DietPlan.find({
            clientId: id,
            $or: [
                { weekStartDate: targetDate },
                { 'days.date': { $gte: targetDate, $lte: endDate } }
            ]
        }).sort({ weekStartDate: 1 });

        // 2. Fallback: check legacy Monday start
        if (matchingPlans.length === 0) {
            const mondayStart = format(startOfWeek(new Date(startDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (mondayStart !== startDate) {
                const mondayPlan = await DietPlan.findOne({
                    clientId: id,
                    weekStartDate: normalizeDateUTC(mondayStart)
                });
                if (mondayPlan) {
                    matchingPlans = [mondayPlan];
                }
            }
        }

        // 3. Fallback: If no plan found for requested range, find nearest upcoming published plan
        if (matchingPlans.length === 0) {
            const upcomingPlan = await DietPlan.findOne({
                clientId: id,
                'days.status': 'PUBLISHED',
                weekStartDate: { $gte: targetDate }
            }).sort({ weekStartDate: 1 });
            if (upcomingPlan) {
                matchingPlans = [upcomingPlan];
            }
        }

        let dietPlan = null;
        if (matchingPlans.length > 0) {
            // Merge days across all matching plans so rolling day shifts stitch seamlessly
            const allDaysMap = new Map<string, any>();
            for (const plan of matchingPlans) {
                for (const d of plan.days || []) {
                    if (d.date) {
                        const dStr = new Date(d.date).toISOString().split('T')[0];
                        allDaysMap.set(dStr, d);
                    }
                }
            }
            const primaryPlan = matchingPlans[0].toObject ? matchingPlans[0].toObject() : matchingPlans[0];
            dietPlan = reanchorDietPlan({
                ...primaryPlan,
                days: Array.from(allDaysMap.values())
            }, targetDate);

            // Automatically link recipes by dish name from dietician's recipe library
            const dieticianId = client.dieticianId || (user.role === 'DIETICIAN' ? user._id : undefined);
            if (dieticianId) {
                dietPlan = await syncDietPlanWithRecipes(dietPlan, dieticianId);
            }

            const previewMode = url.searchParams.get('previewMode');
            if (previewMode === 'client') {
                const plainPlan = typeof (dietPlan as any).toObject === 'function' ? (dietPlan as any).toObject() : JSON.parse(JSON.stringify(dietPlan));
                const filteredDays = (plainPlan.days || []).map((day: any) => ({
                    ...day,
                    meals: day.status === 'PUBLISHED' ? day.meals : [],
                    status: day.status === 'PUBLISHED' ? 'PUBLISHED' : 'NO_DIET'
                }));
                return NextResponse.json({
                    ...plainPlan,
                    days: filteredDays
                });
            }
        }

        return NextResponse.json(dietPlan || { success: true, message: 'No plan found' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch diet plan' }, { status: 500 });
    }
}

function getCanonicalWeekStart(dayDate: Date, anchorStartDate?: Date | string | null): Date {
    const target = normalizeDateUTC(dayDate);
    if (anchorStartDate) {
        const anchor = normalizeDateUTC(anchorStartDate);
        const anchorDay = anchor.getUTCDay();
        const currentDay = target.getUTCDay();
        const diff = (currentDay - anchorDay + 7) % 7;
        const weekStart = new Date(target);
        weekStart.setUTCDate(target.getUTCDate() - diff);
        return weekStart;
    }
    const currentDay = target.getUTCDay();
    const diff = (currentDay - 1 + 7) % 7;
    const weekStart = new Date(target);
    weekStart.setUTCDate(target.getUTCDate() - diff);
    return weekStart;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    try {
        const { weekStartDate, days } = body;

        // Normalize all dates in the days array to UTC to prevent timezone issues
        const normalizedDays = days.map((day: any) => ({
            ...day,
            date: normalizeDateUTC(day.date)
        }));

        // Link recipes before saving
        const Client = (await import('@/models/Client')).default;
        const client = await Client.findById(id).select('dieticianId dietStartDate').lean();
        if (client?.dieticianId) {
            await syncDietPlanWithRecipes({ days: normalizedDays }, client.dieticianId);
        }

        // Group submitted days by their canonical week start date
        const groups = new Map<string, { canonicalDate: Date; days: any[] }>();
        for (const day of normalizedDays) {
            const canonical = getCanonicalWeekStart(day.date, client?.dietStartDate);
            const key = canonical.toISOString().split('T')[0];
            if (!groups.has(key)) {
                groups.set(key, { canonicalDate: canonical, days: [] });
            }
            groups.get(key)!.days.push(day);
        }

        // Upsert each canonical week document with the updated days
        for (const { canonicalDate, days: daysForWeek } of groups.values()) {
            let existingPlan = await DietPlan.findOne({ clientId: id, weekStartDate: canonicalDate });

            if (!existingPlan) {
                // Initialize a standard 7-day structure for the canonical week
                const fullWeekDays = Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date(canonicalDate);
                    d.setUTCDate(d.getUTCDate() + i);
                    return {
                        date: d,
                        status: 'NO_DIET',
                        meals: []
                    };
                });
                existingPlan = new DietPlan({
                    clientId: id,
                    weekStartDate: canonicalDate,
                    days: fullWeekDays
                });
            }

            // Merge incoming days into the existing plan's days array by date
            const planDaysMap = new Map<string, any>();
            for (const d of existingPlan.days || []) {
                if (d.date) {
                    const dStr = new Date(d.date).toISOString().split('T')[0];
                    planDaysMap.set(dStr, d.toObject ? d.toObject() : d);
                }
            }

            for (const incomingDay of daysForWeek) {
                const incomingDateStr = new Date(incomingDay.date).toISOString().split('T')[0];
                planDaysMap.set(incomingDateStr, {
                    ...incomingDay,
                    date: normalizeDateUTC(incomingDay.date)
                });
            }

            // Ensure 7 days ordered by date
            const sortedDays = Array.from(planDaysMap.values()).sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            existingPlan.days = sortedDays;
            await existingPlan.save();
        }

        // Also fetch and return the plan re-anchored to the requested weekStartDate
        const requestedTarget = normalizeDateUTC(weekStartDate);
        const savedPlans = await DietPlan.find({
            clientId: id,
            $or: [
                { weekStartDate: requestedTarget },
                { 'days.date': { $gte: requestedTarget, $lte: new Date(requestedTarget.getTime() + 6 * 86400000) } }
            ]
        }).sort({ weekStartDate: 1 });

        const allDaysMap = new Map<string, any>();
        for (const p of savedPlans) {
            for (const d of p.days || []) {
                if (d.date) {
                    const dStr = new Date(d.date).toISOString().split('T')[0];
                    allDaysMap.set(dStr, d);
                }
            }
        }

        const basePlan = savedPlans.length > 0 ? (savedPlans[0].toObject ? savedPlans[0].toObject() : savedPlans[0]) : { clientId: id, weekStartDate: requestedTarget };
        const returnPlan = reanchorDietPlan({
            ...basePlan,
            days: Array.from(allDaysMap.values())
        }, requestedTarget);

        return NextResponse.json(returnPlan);
    } catch (error) {
        console.error('Error saving diet plan:', error);
        return NextResponse.json({ error: 'Failed to save diet plan' }, { status: 500 });
    }
}

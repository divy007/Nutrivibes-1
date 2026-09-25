import { NextResponse } from 'next/server';
import { connectDB as dbConnect } from '@/lib/mongodb';
import DietPlan from '@/models/DietPlan';
import Client from '@/models/Client';
import { format } from 'date-fns';
import { verifyToken } from '@/lib/auth';
import { normalizeDateUTC, reanchorDietPlan } from '@/lib/date-utils';
import { syncDietPlanWithRecipes } from '@/lib/recipe-sync';

export async function GET(req: Request) {
    await dbConnect();

    try {
        // Extract and verify token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded || decoded.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized - Client access only' }, { status: 403 });
        }

        const userId = decoded.userId;

        // Find the Client profile associated with this User
        const client = await Client.findOne({ userId: userId });

        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const url = new URL(req.url);
        const startDate = url.searchParams.get('startDate') || format(new Date(), 'yyyy-MM-dd');
        const targetDate = normalizeDateUTC(startDate);
        const endDate = new Date(targetDate);
        endDate.setDate(endDate.getDate() + 6);

        // 1. Find all plans that match targetDate or overlap with [targetDate, endDate]
        let matchingPlans = await DietPlan.find({
            clientId: client._id,
            $or: [
                { weekStartDate: targetDate },
                { 'days.date': { $gte: targetDate, $lte: endDate } }
            ]
        }).sort({ weekStartDate: 1 });

        // 2. Fallback: Check for legacy plans saved with a Monday start
        if (matchingPlans.length === 0) {
            const { startOfWeek } = await import('date-fns');
            const mondayStart = format(startOfWeek(new Date(startDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            if (mondayStart !== startDate) {
                const mondayPlan = await DietPlan.findOne({
                    clientId: client._id,
                    weekStartDate: normalizeDateUTC(mondayStart)
                });
                if (mondayPlan) {
                    matchingPlans = [mondayPlan];
                }
            }
        }

        // 3. Fallback: If no plan exists for requested week, find nearest upcoming published plan
        let isFallbackUpcoming = false;
        if (matchingPlans.length === 0) {
            const upcomingPlan = await DietPlan.findOne({
                clientId: client._id,
                'days.status': 'PUBLISHED',
                weekStartDate: { $gte: targetDate }
            }).sort({ weekStartDate: 1 });
            if (upcomingPlan) {
                matchingPlans = [upcomingPlan];
                isFallbackUpcoming = true;
            }
        }

        if (matchingPlans.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No plan found',
                data: null
            });
        }

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
        const combinedPlan = {
            ...primaryPlan,
            days: Array.from(allDaysMap.values())
        };

        // Dynamically re-anchor the plan days
        const anchorDate = isFallbackUpcoming && primaryPlan.weekStartDate ? normalizeDateUTC(primaryPlan.weekStartDate) : targetDate;
        const reanchoredPlan = reanchorDietPlan(combinedPlan, anchorDate);

        // Ensure plan is a plain object before mapping to avoid losing Mongoose schema getters (like date)
        let plainPlan = typeof (reanchoredPlan as any).toObject === 'function'
            ? (reanchoredPlan as any).toObject()
            : JSON.parse(JSON.stringify(reanchoredPlan));

        // Automatically link recipes by dish name from dietician's recipe library
        if (client.dieticianId) {
            plainPlan = await syncDietPlanWithRecipes(plainPlan, client.dieticianId);
        }

        // Update read receipt timestamp if published meals exist
        const hasPublishedMeals = (plainPlan.days || []).some((d: any) => d.status === 'PUBLISHED');
        let updatedLastViewedAt = primaryPlan.lastViewedByClientAt;
        if (hasPublishedMeals) {
            updatedLastViewedAt = new Date();
            try {
                await DietPlan.findByIdAndUpdate(primaryPlan._id, { lastViewedByClientAt: updatedLastViewedAt });
            } catch (e) {
                // Ignore save error in view read receipt
            }
        }

        // Filter to only return PUBLISHED days
        const filteredDays = (plainPlan.days || []).map((day: any) => ({
            ...day,
            meals: day.status === 'PUBLISHED' ? day.meals : [],
            status: day.status === 'PUBLISHED' ? 'PUBLISHED' : 'NO_DIET'
        }));

        const response = {
            ...plainPlan,
            lastViewedByClientAt: updatedLastViewedAt,
            days: filteredDays
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Failed to fetch client diet plan:', error);
        return NextResponse.json({ error: 'Failed to fetch diet plan' }, { status: 500 });
    }
}

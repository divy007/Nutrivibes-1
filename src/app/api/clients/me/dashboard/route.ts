import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WeightLog from '@/models/WeightLog';
import WaterIntake from '@/models/WaterIntake';
import MealLog from '@/models/MealLog';
import MeasurementLog from '@/models/MeasurementLog';
import DietPlan from '@/models/DietPlan';
import PeriodLog from '@/models/PeriodLog';
import { getAuthUser } from '@/lib/auth';
import { startOfDay, startOfWeek } from 'date-fns';
import { calculateCycleStatus } from '@/lib/cycle-utils';
import { normalizeDateUTC } from '@/lib/date-utils';

export async function GET(req: Request) {
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

        const { searchParams } = new URL(req.url);
        const clientDate = searchParams.get('date');

        const today = normalizeDateUTC(clientDate || undefined);
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });

        const [weightLogs, waterIntake, mealLogs, measurementLogs, dietPlan, lastPeriodLog] = await Promise.all([
            WeightLog.find({ clientId: client._id }).sort({ date: -1 }).limit(10).lean(),
            WaterIntake.findOne({ clientId: client._id, date: today }).lean(),
            MealLog.find({ clientId: client._id }).sort({ createdAt: -1 }).limit(5).lean(),
            MeasurementLog.find({ clientId: client._id }).sort({ date: -1 }).limit(5).lean(),
            DietPlan.findOne({ clientId: client._id, weekStartDate: weekStart }), // Keep as document for day processing if needed, or lean and remove toObject
            PeriodLog.findOne({ clientId: client._id }).sort({ startDate: -1 }).lean(),
        ]);

        // Process diet plan to only show PUBLISHED items
        let processedDietPlan = null;
        if (dietPlan) {
            const filteredDays = dietPlan.days.map((day: any) => ({
                ...day,
                meals: day.status === 'PUBLISHED' ? day.meals : [],
                status: day.status === 'PUBLISHED' ? 'PUBLISHED' : 'NO_DIET'
            }));
            processedDietPlan = {
                ...dietPlan.toObject(),
                days: filteredDays
            };
        }

        // Ensure water intake exists for today
        let todayWater = waterIntake;
        if (!todayWater) {
            todayWater = await WaterIntake.create({
                clientId: client._id,
                date: today,
                currentGlasses: 0,
                targetGlasses: 8
            });
        }

        // Calculate cycle status if client is female
        let cycleStatus = null;
        if (client.gender === 'female' && lastPeriodLog) {
            cycleStatus = calculateCycleStatus(
                lastPeriodLog.startDate,
                client.cycleLength || 28
            );
        }

        return NextResponse.json({
            profile: client,
            weightLogs,
            waterData: todayWater,
            mealLogs,
            measurementLogs,
            dietPlan: processedDietPlan,
            cycleStatus,
            lastPeriodLog
        });
    } catch (error: any) {
        console.error('Failed to fetch dashboard summary - Full error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            error: `Dashboard failed: ${errorMessage}`,
            details: errorMessage
        }, { status: 500 });
    }
}

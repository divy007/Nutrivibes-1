import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WeightLog from '@/models/WeightLog';
import WaterIntake from '@/models/WaterIntake';
import MealLog from '@/models/MealLog';
import MeasurementLog from '@/models/MeasurementLog';
import DietPlan from '@/models/DietPlan';
import { getAuthUser } from '@/lib/auth';
import { startOfDay, startOfWeek } from 'date-fns';

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

        const today = startOfDay(new Date());
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });

        const [weightLogs, waterIntake, mealLogs, measurementLogs, dietPlan] = await Promise.all([
            WeightLog.find({ clientId: client._id }).sort({ date: -1 }).limit(10),
            WaterIntake.findOne({ clientId: client._id, date: today }),
            MealLog.find({ clientId: client._id }).sort({ createdAt: -1 }).limit(5),
            MeasurementLog.find({ clientId: client._id }).sort({ date: -1 }).limit(5),
            DietPlan.findOne({ clientId: client._id, weekStartDate: weekStart }),
        ]);

        // Process diet plan to only show PUBLISHED items
        let processedDietPlan = null;
        if (dietPlan) {
            const filteredDays = dietPlan.days.map((day: any) => ({
                ...day.toObject(),
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

        return NextResponse.json({
            profile: client,
            weightLogs,
            waterData: todayWater,
            mealLogs,
            measurementLogs,
            dietPlan: processedDietPlan
        });
    } catch (error) {
        console.error('Failed to fetch dashboard summary:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}

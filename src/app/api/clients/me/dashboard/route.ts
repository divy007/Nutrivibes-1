import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Client from '@/models/Client';
import WeightLog from '@/models/WeightLog';
import WaterIntake from '@/models/WaterIntake';
import MealLog from '@/models/MealLog';
import MeasurementLog from '@/models/MeasurementLog';
import DietPlan from '@/models/DietPlan';
import PeriodLog from '@/models/PeriodLog';
import HealthAssessment from '@/models/HealthAssessment';
import { getAuthPayload } from '@/lib/auth';
import { startOfDay, startOfWeek } from 'date-fns';
import { calculateCycleStatus } from '@/lib/cycle-utils';
import { normalizeDateUTC } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    await connectDB();
    try {
        const user = getAuthPayload(req);
        if (!user || user.role !== 'CLIENT') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await Client.findOne({ userId: user.userId });
        if (!client) {
            return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const clientDate = searchParams.get('date');

        const today = normalizeDateUTC(clientDate || undefined);
        const weekStart = startOfWeek(today, { weekStartsOn: 1 });

        const [weightLogs, waterIntake, mealLogs, measurementLogs, dietPlan, lastPeriodLog, assessment] = await Promise.all([
            WeightLog.find({ clientId: client._id }).sort({ date: -1, createdAt: -1 }).limit(10).lean().catch(e => { console.error('WeightLog fetch failed:', e); return []; }),
            WaterIntake.findOne({ clientId: client._id, date: today }).lean().catch(e => { console.error('WaterIntake fetch failed:', e); return null; }),
            MealLog.find({ clientId: client._id, date: today }).sort({ createdAt: -1 }).limit(5).lean().catch(e => { console.error('MealLog fetch failed:', e); return []; }),
            MeasurementLog.find({ clientId: client._id }).sort({ date: -1 }).limit(5).lean().catch(e => { console.error('MeasurementLog fetch failed:', e); return []; }),
            DietPlan.findOne({ clientId: client._id, weekStartDate: weekStart }).catch(e => { console.error('DietPlan fetch failed:', e); return null; }),
            PeriodLog.findOne({ clientId: client._id }).sort({ startDate: -1 }).lean().catch(e => { console.error('PeriodLog fetch failed:', e); return null; }),
            HealthAssessment.findOne({ clientId: client._id }).sort({ date: -1 }).lean().catch(e => { console.error('HealthAssessment fetch failed:', e); return null; })
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
        // Ensure water intake exists for today
        let todayWater = waterIntake;
        if (!todayWater) {
            try {
                todayWater = await WaterIntake.create({
                    clientId: client._id,
                    date: today,
                    currentGlasses: 0,
                    targetGlasses: 8
                });
            } catch (err: any) {
                // If race condition caused duplicate key error, fetch the existing one
                if (err.code === 11000) {
                    todayWater = await WaterIntake.findOne({ clientId: client._id, date: today }).lean();
                } else {
                    console.error('Failed to create water intake record:', err);
                    // todayWater remains null, dashboard proceeds without it
                }
            }
        }

        // Calculate cycle status if client is female
        let cycleStatus = null;
        if (client.gender === 'female' && lastPeriodLog) {
            cycleStatus = calculateCycleStatus(
                lastPeriodLog.startDate,
                client.cycleLength || 28,
                today  // Pass normalized IST date as reference
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
            lastPeriodLog,
            assessment
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

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { WeightTrackerCard } from '@/components/client/dashboard/WeightTrackerCard';
import { LogWeightModal } from '@/components/client/dashboard/LogWeightModal';
import { WaterIntakeTracker } from '@/components/client/dashboard/WaterIntakeTracker';
import { MealLogCard } from '@/components/client/dashboard/MealLogCard';
import { LogMealModal } from '@/components/client/dashboard/LogMealModal';
import { MeasurementTrackerCard } from '@/components/client/dashboard/MeasurementTrackerCard';
import { LogMeasurementModal } from '@/components/client/dashboard/LogMeasurementModal';
import { Loader2, Activity, ChevronRight } from 'lucide-react';
import { getLocalDateString } from '@/lib/date-utils';

interface ClientProfile {
    _id: string;
    name: string;
    email: string;
    weight?: number;
    height?: number;
    idealWeight?: number;
    dietStartDate?: string;
    createdAt: string;
}

interface WeightLog {
    _id: string;
    weight: number;
    unit: string;
    date: string;
}

interface WaterData {
    currentGlasses: number;
    targetGlasses: number;
}

interface MealLog {
    _id: string;
    category: string;
    items: { name: string; quantity: string }[];
    date: string;
}

interface MeasurementLog {
    _id: string;
    date: string;
    chest: number;
    arms: number;
    waist: number;
    hips: number;
    thigh: number;
    unit: string;
}

export default function ClientDashboard() {
    const { user } = useAuth(true);
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [waterData, setWaterData] = useState<WaterData | null>(null);
    const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
    const [measurementLogs, setMeasurementLogs] = useState<MeasurementLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [isMealModalOpen, setIsMealModalOpen] = useState(false);
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
    const [assessment, setAssessment] = useState<any>(null);

    const fetchData = async () => {
        try {
            const today = getLocalDateString();
            const [profileData, logsData, waterIntakeData, mealLogsData, measurementLogsData, assessmentData] = await Promise.all([
                api.get<ClientProfile>('/api/clients/me'),
                api.get<WeightLog[]>('/api/clients/me/weight-logs'),
                api.get<WaterData>(`/api/clients/me/water-intake?date=${today}`),
                api.get<MealLog[]>('/api/clients/me/meal-logs'),
                api.get<MeasurementLog[]>('/api/clients/me/measurement-logs'),
                api.get<any>('/api/clients/me/health-assessment')
            ]);
            setProfile(profileData);
            setWeightLogs(logsData);
            setWaterData(waterIntakeData);
            setMealLogs(mealLogsData);
            setMeasurementLogs(measurementLogsData);
            setAssessment(assessmentData);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const handleSaveWeight = async (weight: number, unit: 'kg' | 'lb', date: Date) => {
        // OPTIMISTIC UPDATE
        const newLog: WeightLog = {
            _id: 'temp-' + Date.now(),
            weight,
            unit,
            date: date.toISOString()
        };
        setWeightLogs(prev => [newLog, ...prev]);

        try {
            await api.post('/api/clients/me/weight-logs', { weight, unit, date });
            await fetchData(); // Final sync
        } catch (error) {
            console.error('Failed to save weight log:', error);
            // Revert
            setWeightLogs(prev => prev.filter(l => l._id !== newLog._id));
            alert('Failed to save weight log');
        }
    };

    const handleAddGlass = async () => {
        // OPTIMISTIC UPDATE
        if (waterData) {
            setWaterData({
                ...waterData,
                currentGlasses: waterData.currentGlasses + 1
            });
        }
        try {
            const today = getLocalDateString();
            await api.post('/api/clients/me/water-intake', {
                increment: 1,
                date: today
            });
            // Data is already updated locally, no need to fetchData() unless you want to sync
        } catch (error) {
            console.error('Failed to update water intake:', error);
            // Revert on failure
            setWaterData(prev => prev ? { ...prev, currentGlasses: prev.currentGlasses - 1 } : null);
        }
    };

    const handleSaveMeal = async (category: string, items: { name: string; quantity: string }[]) => {
        try {
            await api.post('/api/clients/me/meal-logs', { category, items });
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to save meal log:', error);
        }
    };

    const handleSaveMeasurement = async (measurements: any, unit: string, date: Date) => {
        try {
            await api.post('/api/clients/me/measurement-logs', { ...measurements, unit, date });
            await fetchData(); // Refresh data
        } catch (error) {
            console.error('Failed to save measurement log:', error);
            alert('Failed to save measurement log');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <img
                        src="/brand-logo.png"
                        alt="NutriVibes"
                        className="h-20 w-auto mx-auto animate-pulse"
                    />
                    <Loader2 className="w-8 h-8 animate-spin text-brand-sage mx-auto" />
                </div>
            </div>
        );
    }

    // Default weights if not set (for demo/UI)
    const currentWeight = profile?.weight || 0;
    const idealWeight = profile?.idealWeight || currentWeight;

    // Attempt to find start weight (oldest log or profile creation weight)
    const startWeight = weightLogs.length > 0
        ? weightLogs[weightLogs.length - 1].weight
        : currentWeight;

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
            <header className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-sage/10 text-brand-sage rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-sage/20">
                    <Activity size={12} />
                    Personal Wellness Dashboard
                </div>
                <h1 className="text-5xl font-black text-brand-forest tracking-tight">
                    Welcome back, {profile?.name || user?.email?.split('@')[0]}
                </h1>
                <p className="text-slate-500 font-medium text-lg italic opacity-80">Here's what your wellness journey looks like today.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column - Main Tracking */}
                <div className="lg:col-span-8 space-y-8">
                    <MealLogCard onLogClick={() => setIsMealModalOpen(true)} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <WeightTrackerCard
                            startWeight={startWeight}
                            currentWeight={currentWeight}
                            idealWeight={idealWeight}
                            unit="kg"
                            onUpdateClick={() => setIsWeightModalOpen(true)}
                        />
                        {waterData && (
                            <WaterIntakeTracker
                                currentGlasses={waterData.currentGlasses}
                                targetGlasses={waterData.targetGlasses}
                                onAddGlass={handleAddGlass}
                            />
                        )}
                    </div>

                    <MeasurementTrackerCard
                        logs={measurementLogs}
                        onUpdateClick={() => setIsMeasurementModalOpen(true)}
                    />
                </div>

                {/* Right Column - Audit & Insights */}
                <div className="lg:col-span-4 space-y-8 sticky top-[80px]">
                    <div className="bg-gradient-to-br from-brand-forest to-brand-sage rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />

                        <div className="relative z-10 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                                <Activity size={14} />
                                Wellness Audit
                            </div>

                            <h2 className="text-3xl font-black leading-tight tracking-tight">
                                Concerned About Your Weight?
                            </h2>

                            <p className="text-brand-cream/80 font-medium text-sm leading-relaxed">
                                {assessment ? `Your last health score was ${assessment.totalScore}/100. Regular audits help track metabolic progress.` : "Take our 2-minute 'Health Audit' to uncover metabolic barriers and get personalized advice."}
                            </p>

                            <button
                                onClick={() => window.location.href = '/client/health-assessment'}
                                className="w-full py-5 bg-white text-brand-forest rounded-2xl font-black hover:bg-brand-cream transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 group/btn"
                            >
                                {assessment ? 'Retake Audit' : 'Start Audit'}
                                <ChevronRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Quick Stats / Inspiration */}
                    <div className="bg-brand-cream/30 rounded-[32px] p-8 border border-brand-cream flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-brand-earth shadow-sm">
                            <Activity size={32} />
                        </div>
                        <h3 className="font-black text-brand-forest text-xl">Keep Growing!</h3>
                        <p className="text-slate-500 font-medium text-sm italic">
                            "Wellness is a connection of self-care and discipline."
                        </p>
                    </div>
                </div>
            </div>


            <LogWeightModal
                isOpen={isWeightModalOpen}
                onClose={() => setIsWeightModalOpen(false)}
                onSave={handleSaveWeight}
                initialWeight={currentWeight}
            />

            <LogMealModal
                isOpen={isMealModalOpen}
                onClose={() => setIsMealModalOpen(false)}
                onSave={handleSaveMeal}
            />

            <LogMeasurementModal
                isOpen={isMeasurementModalOpen}
                onClose={() => setIsMeasurementModalOpen(false)}
                onSave={handleSaveMeasurement}
                initialValues={measurementLogs[0] ? {
                    chest: measurementLogs[0].chest,
                    arms: measurementLogs[0].arms,
                    waist: measurementLogs[0].waist,
                    hips: measurementLogs[0].hips,
                    thigh: measurementLogs[0].thigh,
                } : undefined}
            />
        </div>
    );

}

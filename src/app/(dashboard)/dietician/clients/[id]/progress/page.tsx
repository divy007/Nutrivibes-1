'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useClientData } from '@/context/ClientDataContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, ReferenceArea
} from 'recharts';
import {
    Activity, TrendingUp, TrendingDown, Scale,
    Droplet, Target, ChevronRight, Info, Loader2, Plus
} from 'lucide-react';
import { MeasurementTrackerCard } from '@/components/client/dashboard/MeasurementTrackerCard';
import { LogMeasurementModal } from '@/components/client/dashboard/LogMeasurementModal';
import { format, subMonths, isAfter } from 'date-fns';
import { calculateCycleStatus } from '@/lib/cycle-utils';
import { getLocalDateString } from '@/lib/date-utils';

interface WeightLog {
    _id: string;
    weight: number;
    unit: string;
    date: string;
}

interface WaterLog {
    _id: string;
    currentGlasses: number;
    targetGlasses: number;
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

export default function ProgressPage() {
    const params = useParams();
    const clientId = params.id as string;
    const { clientInfo } = useClientData();
    const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
    const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
    const [measurementLogs, setMeasurementLogs] = useState<MeasurementLog[]>([]);
    const [periodLogs, setPeriodLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('3m');
    const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            const [wLogs, hLogs, mLogs, pLogs] = await Promise.all([
                api.get<WeightLog[]>(`/api/clients/${clientId}/weight-logs`),
                api.get<WaterLog[]>(`/api/clients/${clientId}/water-intake`),
                api.get<MeasurementLog[]>(`/api/clients/${clientId}/measurement-logs`),
                api.get<any[]>(`/api/clients/${clientId}/period-logs`)
            ]);
            setWeightLogs(wLogs);
            setWaterLogs(hLogs);
            setMeasurementLogs(mLogs);
            setPeriodLogs(pLogs);
        } catch (err) {
            console.error('Failed to fetch logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (clientId) {
            fetchData();
        }
    }, [clientId]);

    const handleSaveMeasurement = async (measurements: any, unit: string, date: Date) => {
        try {
            await api.post(`/api/clients/${clientId}/measurement-logs`, { ...measurements, unit, date });
            await fetchData();
            setIsMeasurementModalOpen(false);
        } catch (error) {
            console.error('Failed to save measurements:', error);
            alert('Failed to save measurements');
        }
    };

    const filteredWeightData = useMemo(() => {
        const now = new Date();
        let startDate = subMonths(now, 3);
        if (timeRange === '1m') startDate = subMonths(now, 1);
        if (timeRange === '6m') startDate = subMonths(now, 6);

        return [...weightLogs]
            .filter(log => isAfter(new Date(log.date), startDate))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(log => {
                const logDate = new Date(log.date);
                let phase = null;
                if (clientInfo?.gender === 'female' && periodLogs.length > 0) {
                    const status = calculateCycleStatus(
                        new Date(periodLogs[0].startDate),
                        clientInfo.cycleLength || 28,
                        logDate
                    );
                    phase = status.phase;
                }

                return {
                    date: new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(logDate),
                    weight: log.weight,
                    bmi: clientInfo?.height ? parseFloat((log.weight / Math.pow(clientInfo.height / 100, 2)).toFixed(2)) : 0,
                    phase,
                    originalDate: logDate // Keep for ReferenceArea calculation
                };
            });
    }, [weightLogs, timeRange, clientInfo, periodLogs]);

    const stats = useMemo(() => {
        if (weightLogs.length === 0) return null;
        const current = weightLogs[0].weight;
        const start = weightLogs[weightLogs.length - 1].weight;
        const diff = current - start;
        return {
            current,
            start,
            diff: Math.abs(diff).toFixed(2),
            type: diff > 0 ? 'GAIN' : 'LOSS',
            color: diff > 0 ? 'text-red-500' : 'text-green-500'
        };
    }, [weightLogs]);

    const bmiStats = useMemo(() => {
        if (filteredWeightData.length === 0) return null;
        const current = filteredWeightData[filteredWeightData.length - 1].bmi;
        const starting = filteredWeightData[0].bmi;
        const avg = parseFloat((filteredWeightData.reduce((acc, curr) => acc + curr.bmi, 0) / filteredWeightData.length).toFixed(2));
        return { current, starting, avg };
    }, [filteredWeightData]);

    const todayWater = useMemo(() => {
        if (waterLogs.length === 0) return { current: 0, target: 8 };
        // Assuming logs are sorted by date desc, latest is first
        const latest = waterLogs[0];
        const latestDateStr = new Date(latest.date).toISOString().split('T')[0];
        const todayStr = getLocalDateString();
        const isToday = latestDateStr === todayStr;
        return isToday ? { current: latest.currentGlasses, target: latest.targetGlasses } : { current: 0, target: 8 };
    }, [waterLogs]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 bg-slate-50 min-h-full">
            {/* Header / Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weight Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-50 rounded-2xl text-orange-500">
                            <Scale size={24} />
                        </div>
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="bg-slate-50 border-none text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full outline-none"
                        >
                            <option value="1m">1 Month</option>
                            <option value="3m">3 Months</option>
                            <option value="6m">6 Months</option>
                        </select>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-black text-slate-800">{stats?.diff || '0.00'}kg</h3>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${stats?.color}`}>
                                {stats?.type || 'CHANGE'}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Start</div>
                                <div className="text-xs font-black text-slate-700">{stats?.start || '--'}kg</div>
                            </div>
                            <div className="space-y-1 border-x border-slate-100">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Today</div>
                                <div className="text-xs font-black text-slate-700">{stats?.current || '--'}kg</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Change</div>
                                <div className={`text-xs font-black ${stats?.color}`}>{stats?.diff ? `${stats.type === 'GAIN' ? '+' : '-'}${stats.diff}` : '--'}kg</div>
                            </div>
                        </div>
                    </div>
                    {/* Mini Sparkline could go here, but let's keep it clean */}
                </div>

                {/* BMI Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-500">
                            <Activity size={24} />
                        </div>
                        <div className="text-[10px] font-bold text-blue-500 uppercase bg-blue-50 px-3 py-1 rounded-full">
                            Maintain 18 - 25 BMI
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Average BMI</div>
                            <div className="text-xs font-black text-slate-700">{bmiStats?.avg || '--'}</div>
                        </div>
                        <div className="space-y-1 border-x border-slate-100">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Starting</div>
                            <div className="text-xs font-black text-slate-700">{bmiStats?.starting || '--'}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Current</div>
                            <div className="text-xs font-black text-slate-700">{bmiStats?.current || '--'}</div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="h-full bg-blue-400" style={{ width: '18%' }} />
                            <div className="h-full bg-green-400" style={{ width: '25%' }} />
                            <div className="h-full bg-yellow-400" style={{ width: '15%' }} />
                            <div className="h-full bg-orange-400" style={{ width: '20%' }} />
                            <div className="h-full bg-red-400" style={{ width: '22%' }} />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                            <span>35</span>
                        </div>
                    </div>
                </div>

                {/* Water Tracker Card */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-cyan-50 rounded-2xl text-cyan-500">
                            <Droplet size={24} />
                        </div>
                        <div className="text-[10px] font-bold text-orange-500 uppercase bg-orange-50 px-3 py-1 rounded-full">
                            Today
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="#f1f5f9"
                                    strokeWidth="8"
                                    fill="transparent"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="#06b6d4"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 * (1 - (todayWater.current / (todayWater.target || 8) || 0))}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-xl font-black text-slate-800">
                                    {Math.round((todayWater.current / (todayWater.target || 8) || 0) * 100)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining</span>
                                <span className="text-xs font-black text-slate-700">
                                    {Math.max(0, (todayWater.target || 8) - (todayWater.current || 0))}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                                <span className="text-xs font-black text-slate-700">{todayWater.current || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Weight Trend */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h4 className="text-lg font-black text-slate-800">Weight Progress</h4>
                            <div className="flex gap-3 items-center">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e]" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Period</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">PMS</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Energy</span>
                                </div>
                            </div>
                        </div>
                        <button className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">
                            View More
                        </button>
                    </div>
                    <div className="h-[300px] w-full mt-8">
                        {filteredWeightData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={filteredWeightData}>
                                    <defs>
                                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        domain={['dataMin - 2', 'dataMax + 2']}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />

                                    {/* Period Shading */}
                                    {filteredWeightData.map((d, i) => {
                                        if (d.phase === 'PERIOD') {
                                            const next = filteredWeightData[i + 1];
                                            return (
                                                <ReferenceArea
                                                    key={`period-${i}`}
                                                    x1={d.date}
                                                    x2={next ? next.date : d.date}
                                                    fill="#f43f5e"
                                                    fillOpacity={0.05}
                                                    stroke="none"
                                                />
                                            );
                                        }
                                        return null;
                                    })}
                                    <Area
                                        type="monotone"
                                        dataKey="weight"
                                        stroke="#f97316"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorWeight)"
                                        dot={(props: any) => {
                                            const { cx, cy, payload } = props;
                                            if (!payload.phase) return <circle cx={cx} cy={cy} r={4} fill="#f97316" stroke="#fff" strokeWidth={2} />;

                                            const colors: Record<string, string> = {
                                                PERIOD: '#f43f5e',
                                                FOLLICULAR: '#0ea5e9',
                                                OVULATION: '#8b5cf6',
                                                LUTEAL: '#f59e0b',
                                            };

                                            return (
                                                <circle
                                                    cx={cx} cy={cy} r={6}
                                                    fill={colors[payload.phase]}
                                                    stroke="#fff" strokeWidth={2}
                                                />
                                            );
                                        }}
                                        activeDot={{ r: 8, strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <Activity size={48} className="opacity-20" />
                                <span className="text-xs font-bold uppercase tracking-widest">No data available for chart.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* BMI Trend */}
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h4 className="text-lg font-black text-slate-800">BMI Analysis</h4>
                            <p className="text-xs font-medium text-slate-400 tracking-wide">Historical trend of client BMI</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full mt-8">
                        {filteredWeightData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={filteredWeightData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        domain={[15, 40]}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="bmi"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                <Activity size={48} className="opacity-20" />
                                <span className="text-xs font-bold uppercase tracking-widest">No data available for chart.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row - Statistics & Vitals (Placeholder) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                    <MeasurementTrackerCard
                        logs={measurementLogs}
                        onUpdateClick={() => setIsMeasurementModalOpen(true)}
                    />
                </div>

                <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm min-h-[400px]">
                    <div className="flex justify-between items-center mb-12">
                        <h4 className="text-lg font-black text-slate-800">Vitals Tracker</h4>
                        <button className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-600">
                            View More
                        </button>
                    </div>
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-4 py-20">
                        <Activity size={48} className="opacity-20" />
                        <span className="text-xs font-bold uppercase tracking-widest">No data available for chart.</span>
                    </div>
                </div>
            </div>

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

import React from 'react';
import { Plus, Calendar, ChevronRight } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { format } from 'date-fns';

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

interface MeasurementTrackerCardProps {
    logs: MeasurementLog[];
    onUpdateClick?: () => void;
}

export const MeasurementTrackerCard: React.FC<MeasurementTrackerCardProps> = ({
    logs,
    onUpdateClick,
}) => {
    // Colors from the image
    const COLORS = {
        chest: '#A3D139', // Greenish
        arms: '#FF7F50',  // Coral/Orange
        waist: '#8DE1D9', // Cyan/Teal
        hips: '#FFB84D',  // Yellow/Orange
        thigh: '#9B9BFF', // Purple/Blue
    };

    const latestLog = logs[0] || null;

    // Prepare data for the chart - we show at least the latest 4 logs or just the latest one if that's all we have
    // Actually, the image shows "Mo" as a single entry. It seems to be a comparison chart for different dates or just the latest?
    // The image shows 5 bars for ONE date.

    const chartData = latestLog ? [
        { name: 'Chest', value: latestLog.chest, color: COLORS.chest },
        { name: 'Arms', value: latestLog.arms, color: COLORS.arms },
        { name: 'Waist', value: latestLog.waist, color: COLORS.waist },
        { name: 'Hips', value: latestLog.hips, color: COLORS.hips },
        { name: 'Thigh', value: latestLog.thigh, color: COLORS.thigh },
    ] : [];

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-brand-forest">Measurement Tracker</h3>
                <button className="text-brand-sage p-2 hover:bg-brand-cream rounded-xl transition-colors">
                    <Calendar size={24} />
                </button>
            </div>

            {/* Chart Area */}
            <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-50 relative h-64">
                {latestLog ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis
                                dataKey="name"
                                hide
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={12}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 font-bold italic">
                        No measurements logged yet
                    </div>
                )}
                {latestLog && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-xs font-bold">
                        {format(new Date(latestLog.date), 'eee')}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {Object.entries(COLORS).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs font-bold text-slate-500 capitalize">{key}</span>
                    </div>
                ))}
            </div>

            {/* History Section */}
            <div>
                <h4 className="text-lg font-black text-brand-forest mb-4">History</h4>
                <div className="space-y-4">
                    {logs.slice(0, 3).map((log) => (
                        <div key={log._id} className="space-y-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                {format(new Date(log.date), 'dd MMMM yyyy').toLowerCase()}
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 grid grid-cols-5 gap-2 border border-slate-100">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Chest</span>
                                    <span className="text-xs font-black text-slate-800">{log.chest} {log.unit}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Arms</span>
                                    <span className="text-xs font-black text-slate-800">{log.arms} {log.unit}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Waist</span>
                                    <span className="text-xs font-black text-slate-800">{log.waist} {log.unit}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Hips</span>
                                    <span className="text-xs font-black text-slate-800">{log.hips} {log.unit}</span>
                                </div>
                                <div className="flex flex-col items-center border-l border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Thighs</span>
                                    <span className="text-xs font-black text-slate-800">{log.thigh} {log.unit}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-sm italic font-medium">
                            No history found
                        </div>
                    )}
                </div>
            </div>

            {onUpdateClick && (
                <button
                    onClick={onUpdateClick}
                    className="mt-2 w-full py-4 bg-brand-sage hover:bg-brand-forest text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand-sage/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Update Measurement
                </button>
            )}
        </div>
    );
};

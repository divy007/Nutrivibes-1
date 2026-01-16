import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Clock, Droplets } from 'lucide-react';

interface PeriodLog {
    _id: string;
    startDate: string | Date;
    endDate?: string | Date;
    flowIntensity?: 'LOW' | 'MEDIUM' | 'HIGH';
    symptoms?: string[];
    notes?: string;
}

const INTENSITY_LABELS = {
    LOW: 'Light',
    MEDIUM: 'Medium',
    HIGH: 'Heavy',
};

const INTENSITY_COLORS = {
    LOW: 'text-rose-300',
    MEDIUM: 'text-rose-500',
    HIGH: 'text-rose-700',
};

export const PeriodHistory = ({ logs }: { logs: PeriodLog[] }) => {
    if (logs.length === 0) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h4 className="text-lg font-black text-slate-800 mb-6">Cycle History</h4>
                <div className="py-20 text-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                    <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">No cycles logged yet</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
            <h4 className="text-lg font-black text-slate-800 mb-6">Cycle History</h4>
            <div className="space-y-4">
                {logs.map((log) => {
                    const start = new Date(log.startDate);
                    const end = log.endDate ? new Date(log.endDate) : null;
                    const duration = end ? differenceInDays(end, start) + 1 : null;

                    return (
                        <div key={log._id} className="group p-4 rounded-3xl border border-slate-50 hover:border-rose-100 hover:bg-rose-50/30 transition-all">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-rose-50 rounded-2xl text-rose-500 group-hover:bg-rose-100 transition-colors">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-800">
                                            {format(start, 'MMMM yyyy')}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            Started {format(start, 'do MMM')}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6 items-center">
                                    {duration && (
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                <Clock size={10} /> Duration
                                            </span>
                                            <span className="text-xs font-black text-slate-700">{duration} Days</span>
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                            <Droplets size={10} /> Flow
                                        </span>
                                        <span className={`text-xs font-black ${INTENSITY_COLORS[log.flowIntensity || 'MEDIUM']}`}>
                                            {INTENSITY_LABELS[log.flowIntensity || 'MEDIUM']}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {(log.symptoms?.length ?? 0) > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1.5 pl-14">
                                    {log.symptoms?.map(s => (
                                        <span key={s} className="px-2 py-0.5 rounded-full bg-white border border-rose-100 text-[9px] font-bold text-rose-400 uppercase">
                                            {s.replace('_', ' ')}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

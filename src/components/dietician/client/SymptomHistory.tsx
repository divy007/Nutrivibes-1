import React from 'react';
import { format } from 'date-fns';
import { Smile, Frown, Zap, Ghost, AlertCircle, Calendar } from 'lucide-react';

interface SymptomLog {
    _id: string;
    date: string | Date;
    symptoms: string[];
    energyLevel: number;
    notes?: string;
}

const SYMPTOM_ICONS: Record<string, React.ReactNode> = {
    acidity: <Zap size={14} className="text-amber-500" />,
    bloating: <Ghost size={14} className="text-indigo-400" />,
    low_energy: <Frown size={14} className="text-red-400" />,
    stomach_pain: <AlertCircle size={14} className="text-rose-500" />,
    feeling_great: <Smile size={14} className="text-emerald-500" />,
    headache: <Zap size={14} className="text-orange-400" />,
    cravings: <Smile size={14} className="text-pink-400" />,
};

const SYMPTOM_LABELS: Record<string, string> = {
    acidity: 'Acidity',
    bloating: 'Bloating',
    low_energy: 'Low Energy',
    stomach_pain: 'Stomach Pain',
    feeling_great: 'Feeling Great',
    headache: 'Headache',
    cravings: 'Cravings',
};

export const SymptomHistory = ({ logs }: { logs: SymptomLog[] }) => {
    if (logs.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Daily Wellness Log</h3>
                <div className="py-8 text-center bg-slate-50/50 rounded border border-dashed border-slate-200">
                    <span className="text-slate-400 text-xs font-medium">No symptoms logged in the last 30 days</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Daily Wellness Log</h3>
            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log._id} className="flex gap-4 p-3 rounded-lg border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all">
                        <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-lg p-2 min-w-[60px] shadow-sm">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                                {new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(new Date(log.date))}
                            </span>
                            <span className="text-sm font-black text-slate-800 tracking-tighter">
                                {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(log.date))}
                            </span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center gap-2">
                            <div className="flex flex-wrap gap-2">
                                {log.symptoms.map(s => (
                                    <div key={s} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white border border-slate-100 text-[10px] font-bold text-slate-600 shadow-sm">
                                        {SYMPTOM_ICONS[s] || <AlertCircle size={14} />}
                                        <span>{SYMPTOM_LABELS[s] || s}</span>
                                    </div>
                                ))}
                                {log.symptoms.length === 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 italic">No specific symptoms</span>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Energy:</span>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(lvl => (
                                            <div
                                                key={lvl}
                                                className={`w-1.5 h-1.5 rounded-full ${lvl <= log.energyLevel ? 'bg-emerald-500' : 'bg-slate-200'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                {log.notes && (
                                    <p className="text-[10px] text-slate-500 font-medium italic truncate max-w-[200px]">
                                        "{log.notes}"
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

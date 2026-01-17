'use client';

import useSWR from 'swr';
import { api } from '@/lib/api-client';
import { formatDistanceToNow } from 'date-fns';
import { Activity, Droplet, Scale, Ruler, FileText, CalendarDays } from 'lucide-react';

interface ActivityLog {
    _id: string;
    type: 'WEIGHT_LOG' | 'WATER_LOG' | 'MEASUREMENT_LOG' | 'SYMPTOM_LOG' | 'PERIOD_LOG';
    description: string;
    value?: string;
    timestamp: string;
    clientId: {
        _id: string;
        name: string;
        imageUrl?: string;
    };
}

const fetcher = (url: string) => api.get<ActivityLog[]>(url);

export default function ActivityFeed() {
    // Optimized Request Strategy:
    // 1. Poll every 30s (instead of 10s) to reduce server load
    // 2. Instant update when window is focused (Smart Polling)
    const { data: activities, error } = useSWR('/api/dietician/activity-feed', fetcher, {
        refreshInterval: 30000,
        revalidateOnFocus: true,
        dedupingInterval: 5000
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'WEIGHT_LOG': return <Scale size={14} className="text-blue-500" />;
            case 'WATER_LOG': return <Droplet size={14} className="text-cyan-500" />;
            case 'MEASUREMENT_LOG': return <Ruler size={14} className="text-indigo-500" />;
            case 'SYMPTOM_LOG': return <Activity size={14} className="text-rose-500" />;
            case 'PERIOD_LOG': return <CalendarDays size={14} className="text-pink-500" />;
            default: return <FileText size={14} className="text-slate-400" />;
        }
    };

    return (
        <div className="bg-white rounded-[32px] soft-shadow border border-slate-100 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-brand-forest text-lg">Live Feed</h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                {!activities ? (
                    <div className="text-center py-10 text-slate-400 text-sm">Loading feed...</div>
                ) : activities.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">No recent activity</div>
                ) : (
                    activities.map((log) => (
                        <div key={log._id} className="flex gap-4 group">
                            {/* Avatar */}
                            <div className="flex-shrink-0 mt-1">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {log.clientId?.imageUrl ? (
                                        <img src={log.clientId.imageUrl} alt={log.clientId.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs font-bold text-slate-400">{log.clientId?.name?.charAt(0)}</span>
                                    )}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs font-black text-slate-700 truncate">
                                        {log.clientId?.name || 'Unknown Client'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed mb-1.5">
                                    {log.description}
                                </p>

                                {/* Metadata / Value Pill */}
                                <div className="flex items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100 group-hover:border-slate-200 transition-colors">
                                        {getIcon(log.type)}
                                        <span className="text-[10px] font-bold text-slate-600">
                                            {log.value || log.type.replace('_LOG', '').replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

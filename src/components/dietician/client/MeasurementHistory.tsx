import React from 'react';
import { format } from 'date-fns';
import { Ruler, ChevronRight } from 'lucide-react';

interface MeasurementLog {
    _id: string;
    date: string | Date;
    chest: number;
    arms: number;
    waist: number;
    hips: number;
    thigh: number;
    unit: string;
}

export const MeasurementHistory = ({ logs }: { logs: MeasurementLog[] }) => {
    if (logs.length === 0) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
                <h3 className="text-lg font-black text-slate-800 mb-6">Measurement History</h3>
                <div className="py-20 text-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                    <Ruler size={48} className="mx-auto text-slate-200 mb-4" />
                    <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">No history logged</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm overflow-hidden">
            <h3 className="text-lg font-black text-slate-800 mb-6">Measurement History</h3>
            <div className="overflow-x-auto -mx-8 px-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Chest</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Waist</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hips</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Arms</th>
                            <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thigh</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {logs.map((log) => (
                            <tr key={log._id} className="group hover:bg-slate-50/50 transition-colors">
                                <td className="py-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700">
                                            {format(new Date(log.date), 'do MMM, yyyy')}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            {format(new Date(log.date), 'eeee')}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-xs font-black text-slate-800">{log.chest}</span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{log.unit}</span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-xs font-black text-slate-800">{log.waist}</span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{log.unit}</span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-xs font-black text-slate-800">{log.hips}</span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{log.unit}</span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-xs font-black text-slate-800">{log.arms}</span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{log.unit}</span>
                                </td>
                                <td className="py-4 text-center">
                                    <span className="text-xs font-black text-slate-800">{log.thigh}</span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">{log.unit}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

import React from 'react';
import { ChevronRight, Info } from 'lucide-react';

interface MealLog {
    _id: string;
    category: string;
    items: { name: string; quantity: string }[];
    date: string;
    hungerLevel?: number;
    satisfactionLevel?: number;
    emotionalState?: string;
    isTreat?: boolean;
}

interface MealLogCardProps {
    logs: MealLog[];
    onLogClick: () => void;
}

export const MealLogCard: React.FC<MealLogCardProps> = ({ logs, onLogClick }) => {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                    Today's Relationship With Food
                </h3>
            </div>

            <div className="bg-white rounded-[32px] p-8 soft-shadow border border-slate-100 space-y-6">

                {/* Empty State / Add Button */}
                <button
                    onClick={onLogClick}
                    className="w-full py-4 bg-brand-sage hover:bg-brand-forest text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand-sage/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                    <span className="group-hover:scale-110 transition-transform text-lg">+</span>
                    Log a Meal
                </button>

                {/* Logs List */}
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log._id} className="p-5 bg-slate-50/50 rounded-3xl border border-slate-100 space-y-4 hover:border-brand-cream transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="font-black text-sm text-brand-forest uppercase tracking-wider">{log.category}</span>
                                <div className="flex gap-2">
                                    {log.isTreat && (
                                        <span className="px-2 py-1 bg-pink-100 text-pink-600 rounded-full text-[10px] font-bold uppercase tracking-wide border border-pink-200">
                                            Treat Date 🎉
                                        </span>
                                    )}
                                    {log.emotionalState && (
                                        <span className="px-2 py-1 bg-white text-slate-500 rounded-full text-[10px] font-bold border border-slate-200 shadow-sm">
                                            {log.emotionalState}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Food Items */}
                            <div className="pl-4 border-l-2 border-brand-cream space-y-1">
                                {log.items.map((item, i) => (
                                    <div key={i} className="text-sm text-slate-600 font-medium flex justify-between">
                                        <span>{item.name}</span>
                                        <span className="text-slate-400 text-xs">{item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Mindful Metrics */}
                            {(log.hungerLevel || log.satisfactionLevel) && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                    {log.hungerLevel && (
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                                                <span>Hunger</span>
                                                <span>{log.hungerLevel}/10</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-slate-400 rounded-full"
                                                    style={{ width: `${(log.hungerLevel / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    {log.satisfactionLevel && (
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
                                                <span>Satisfaction</span>
                                                <span>{log.satisfactionLevel}/10</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-sage rounded-full"
                                                    style={{ width: `${(log.satisfactionLevel / 10) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {logs.length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm font-medium italic">
                            No meals logged today yet. Start your mindful journey!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

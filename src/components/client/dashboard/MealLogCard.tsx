import React from 'react';
import { ChevronRight, Info } from 'lucide-react';

interface MealLogCardProps {
    onLogClick: () => void;
}

export const MealLogCard: React.FC<MealLogCardProps> = ({ onLogClick }) => {
    return (
        <div className="space-y-4">
            <h3 className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Meal Log
            </h3>

            <div className="bg-white rounded-[32px] p-8 soft-shadow border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <h4 className="text-xl font-black text-brand-forest">Daily Nutrition Score</h4>
                        <Info size={16} className="text-slate-400 cursor-help" />
                    </div>
                </div>

                {/* Score Progress Bars */}
                <div className="flex gap-3 mb-8">
                    <div className="flex-1 h-2 bg-brand-forest rounded-full" />
                    <div className="flex-1 h-2 bg-brand-sage rounded-full" />
                    <div className="flex-1 h-2 bg-brand-earth rounded-full" />
                </div>

                <button
                    onClick={onLogClick}
                    className="w-full py-4 bg-brand-sage hover:bg-brand-forest text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand-sage/20 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    Log Food
                    <span className="text-xl">+</span>
                </button>
            </div>
        </div>
    );
};

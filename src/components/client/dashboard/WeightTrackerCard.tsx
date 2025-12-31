import React from 'react';
import { Target, Flag, CheckCircle2 } from 'lucide-react';

interface WeightTrackerCardProps {
    startWeight: number;
    currentWeight: number;
    idealWeight: number;
    unit: string;
    onUpdateClick: () => void;
}

export const WeightTrackerCard: React.FC<WeightTrackerCardProps> = ({
    startWeight,
    currentWeight,
    idealWeight,
    unit,
    onUpdateClick,
}) => {
    // Calculate progress percentage
    // Progress = (Start - Current) / (Start - Ideal)
    // We assume weight loss is the goal if Start > Ideal
    const isWeightLoss = startWeight > idealWeight;
    let progress = 0;

    if (isWeightLoss) {
        const totalToLose = startWeight - idealWeight;
        const lostSoFar = startWeight - currentWeight;
        progress = Math.max(0, Math.min(100, (lostSoFar / totalToLose) * 100));
    } else {
        // Weight gain goal
        const totalToGain = idealWeight - startWeight;
        const gainedSoFar = currentWeight - startWeight;
        progress = Math.max(0, Math.min(100, (gainedSoFar / totalToGain) * 100));
    }

    return (
        <div className="bg-white rounded-[32px] p-6 soft-shadow border border-slate-100">
            <h3 className="text-xl font-black text-brand-forest mb-6">Weight Tracker</h3>

            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex items-center gap-2">
                    <Flag size={18} className="text-brand-earth" />
                    <span className="text-sm font-bold text-slate-500">Start: {startWeight} {unit}</span>
                </div>

                <div className="text-center">
                    <span className="text-2xl font-black text-brand-forest">{currentWeight} {unit}</span>
                </div>

                <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-brand-sage" />
                    <span className="text-sm font-bold text-slate-500">Ideal: {idealWeight} {unit}</span>
                </div>
            </div>

            <div className="relative h-2 bg-slate-200 rounded-full mb-8 mx-2 overflow-visible">
                <div
                    className="absolute h-full bg-brand-sage rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%` }}
                />
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-brand-sage rounded-full shadow-md transition-all duration-1000 ease-out z-10"
                    style={{ left: `calc(${progress}% - 10px)` }}
                />
            </div>

            <p className="text-center text-xs font-bold text-slate-500 mb-8 italic">
                "Every step counts. Let's get started - your journey begins here!"
            </p>

            <button
                onClick={onUpdateClick}
                className="w-full py-4 bg-brand-sage hover:bg-brand-forest text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand-sage/20 active:scale-[0.98]"
            >
                Update Weight
            </button>
        </div>
    );
};

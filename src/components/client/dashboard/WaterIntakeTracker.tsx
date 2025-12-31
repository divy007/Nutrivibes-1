import React from 'react';
import { Plus } from 'lucide-react';

interface WaterIntakeTrackerProps {
    currentGlasses: number;
    targetGlasses: number;
    onAddGlass: () => void;
}

export const WaterIntakeTracker: React.FC<WaterIntakeTrackerProps> = ({
    currentGlasses,
    targetGlasses,
    onAddGlass,
}) => {
    const totalVolume = (targetGlasses * 250) / 1000; // liters
    const currentVolume = currentGlasses * 250; // ml

    const glassSlots = Array.from({ length: targetGlasses });

    return (
        <div className="bg-white rounded-[32px] p-6 soft-shadow border border-slate-100">
            <h3 className="text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                Water Intake
            </h3>

            <div className="mb-6 px-2">
                <span className="text-sm font-black text-brand-forest">{currentVolume} ml</span>
                <span className="text-sm font-bold text-slate-400"> / {totalVolume.toFixed(1)}L</span>
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
                {glassSlots.map((_, index) => {
                    const isFilled = index < currentGlasses;
                    const isNextToFill = index === currentGlasses;

                    if (isNextToFill) {
                        return (
                            <button
                                key={index}
                                onClick={onAddGlass}
                                className="flex-shrink-0 w-12 h-12 rounded-full bg-brand-sage text-white flex items-center justify-center shadow-xl shadow-brand-sage/20 hover:scale-110 active:scale-90 transition-all z-10"
                            >
                                <Plus size={24} strokeWidth={3} />
                            </button>
                        );
                    }

                    return (
                        <div
                            key={index}
                            className="flex-shrink-0 relative w-8 h-10"
                        >
                            {/* Glass Shape */}
                            <div className={`absolute inset-0 border-2 rounded-b-lg rounded-t-sm transition-all duration-500 overflow-hidden ${isFilled ? 'border-brand-sage bg-brand-cream/30' : 'border-slate-100 bg-white/50'
                                }`}>
                                {/* Water Fill Animation */}
                                {isFilled && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-brand-sage/30 animate-in slide-in-from-bottom duration-700 h-full" />
                                )}
                            </div>

                            {/* Glass Highlights */}
                            <div className="absolute top-1 left-1 w-1 h-3 bg-white/60 rounded-full" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

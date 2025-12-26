import { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Plus } from 'lucide-react';
import { MealTiming } from '@/types';

interface UpdateMealTimingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (timings: MealTiming[]) => void;
    currentTimings: MealTiming[];
}

export const UpdateMealTimingsModal: React.FC<UpdateMealTimingsModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentTimings
}) => {
    const [timings, setTimings] = useState<MealTiming[]>([]);

    useEffect(() => {
        if (isOpen) {
            setTimings([...currentTimings]);
        }
    }, [isOpen, currentTimings]);

    const handleTimeChange = (index: number, newTime: string) => {
        const newTimings = [...timings];
        newTimings[index] = { ...newTimings[index], time: newTime };
        setTimings(newTimings);
    };

    const handleAddMeal = () => {
        const nextMealNumber = timings.length + 1;
        setTimings([...timings, { mealNumber: nextMealNumber, time: '12:00' }]);
    };

    const handleReset = () => {
        setTimings([...currentTimings]);
    };

    const handleSave = () => {
        onSave(timings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-center items-center relative">
                    <h3 className="text-xl font-bold text-slate-800">Update Meal Timings</h3>
                    <button
                        onClick={onClose}
                        className="absolute right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8">
                    {/* Timings Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                        {timings.map((meal, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <label className="w-16 text-sm font-bold text-slate-600 shrink-0">
                                    Meal - {meal.mealNumber}
                                </label>
                                <div className="flex-1 relative">
                                    <input
                                        type="time"
                                        value={meal.time}
                                        onChange={(e) => handleTimeChange(index, e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all appearance-none"
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 pointer-events-none" />
                                </div>
                                <button className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                    <RotateCcw size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Meal Button */}
                    <div className="mt-8">
                        <button
                            onClick={handleAddMeal}
                            className="bg-black text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors"
                        >
                            Add Meal
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 text-sm font-bold text-orange-500 bg-white border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-8 py-2 text-sm font-bold text-white bg-orange-500 rounded-lg shadow-sm hover:bg-orange-600 transition-all"
                    >
                        Save Meal Timings
                    </button>
                </div>
            </div>
        </div>
    );
};

import { useMemo } from 'react';
import { FoodItem } from '@/types';
import { format, isSameDay, startOfDay, addDays } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MEAL_SLOTS } from '@/data/meals';

interface MealSlot {
    time: string;
    mealNumber: number;
    foodItems: FoodItem[];
}

interface DayPlan {
    date: Date;
    meals: MealSlot[];
    status?: 'NO_DIET' | 'NOT_SAVED' | 'PUBLISHED';
}

interface ClientWeekPlan {
    weekStartDate: Date;
    days: DayPlan[];
}

interface ClientDietCalendarProps {
    weekPlan: ClientWeekPlan | null;
    onWeekChange: (direction: 'prev' | 'next') => void;
    loading?: boolean;
}

export const ClientDietCalendar: React.FC<ClientDietCalendarProps> = ({
    weekPlan,
    onWeekChange,
    loading = false
}) => {
    // Generate the 7 days of the current view based on weekPlan.weekStartDate
    const weekDays = useMemo(() => {
        if (!weekPlan) {
            const start = startOfDay(new Date());
            return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
        }
        const start = startOfDay(new Date(weekPlan.weekStartDate));
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [weekPlan]);

    const getMealForSlot = (dayPlan: DayPlan | undefined, time: string) => {
        return dayPlan?.meals.find(m => m.time === time);
    };

    if (loading) {
        return (
            <div className="flex flex-col h-full bg-[#FCFCF9] items-center justify-center">
                <div className="text-center space-y-4">
                    <img
                        src="/brand-logo.png"
                        alt="NutriVibes"
                        className="h-16 w-auto mx-auto animate-pulse"
                    />
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-sage mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#FCFCF9]">
            {/* Header / Week Navigation */}
            <div className="flex items-center justify-between p-6 bg-white border-b border-slate-100/50 shadow-sm sticky top-0 z-10">
                <h2 className="text-2xl font-black text-brand-forest tracking-tight">Personal Diet Plan</h2>
                <div className="flex items-center gap-6 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => onWeekChange('prev')}
                        className="p-3 rounded-xl hover:bg-white hover:text-brand-sage hover:shadow-sm transition-all text-slate-400"
                        title="Previous Week"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-sm font-black text-brand-forest uppercase tracking-widest min-w-[200px] text-center">
                        {format(weekDays[0], 'MMM d')} — {format(weekDays[6], 'MMM d, yyyy')}
                    </span>
                    <button
                        onClick={() => onWeekChange('next')}
                        className="p-3 rounded-xl hover:bg-white hover:text-brand-sage hover:shadow-sm transition-all text-slate-400"
                        title="Next Week"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-7 gap-4 min-w-[1200px]">
                    {/* Day Columns */}
                    {weekDays.map((date) => {
                        const dayPlan = weekPlan?.days.find(d => isSameDay(new Date(d.date), date));
                        const isToday = isSameDay(new Date(), date);
                        const isDietPublished = dayPlan?.status === 'PUBLISHED';

                        return (
                            <div key={date.toISOString()} className="flex flex-col gap-3">
                                {/* Date Header */}
                                <div className={`text-center p-4 rounded-3xl border transition-all ${isToday
                                    ? 'bg-brand-sage/5 text-brand-sage border-brand-sage/20 shadow-sm'
                                    : 'bg-white text-slate-600 border-slate-100 shadow-sm'
                                    }`}>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{format(date, 'EEE')}</div>
                                    <div className="text-3xl font-black tracking-tight">{format(date, 'd')}</div>
                                    {/* Status Badge */}
                                    <div className="mt-3">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${isDietPublished
                                            ? 'bg-brand-cream text-brand-earth border-brand-earth/10'
                                            : 'bg-slate-50 text-slate-400 border-slate-100 shadow-inner'
                                            }`}>
                                            {isDietPublished ? 'Published' : 'Empty'}
                                        </span>
                                    </div>
                                </div>

                                {/* Meal Slots */}
                                <div className="flex flex-col gap-3">
                                    {MEAL_SLOTS.map((slot, index) => {
                                        const meal = getMealForSlot(dayPlan, slot.time);
                                        const hasFood = meal && meal.foodItems.length > 0 && isDietPublished;

                                        return (
                                            <div
                                                key={`${date.toISOString()}-${slot.time}`}
                                                className={`bg-white rounded-lg border shadow-sm flex flex-col h-40 overflow-hidden ${isDietPublished ? 'border-slate-200' : 'border-slate-100 bg-slate-50/50'
                                                    }`}
                                            >
                                                {/* Slot Header */}
                                                <div className={`px-3 py-2 border-b flex justify-between items-center text-xs ${isDietPublished
                                                    ? 'bg-slate-50 border-slate-100 text-slate-500'
                                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                                    }`}>
                                                    <span className={`font-medium ${isDietPublished ? 'text-slate-700' : 'text-slate-400'}`}>
                                                        #{index + 1} {slot.time}
                                                    </span>
                                                </div>

                                                {/* Slot Content */}
                                                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                                                    {hasFood ? (
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {meal.foodItems.map((item, idx) => (
                                                                <li key={idx} className="text-xs text-slate-700 leading-tight">
                                                                    <span className="font-medium">{item.name}</span>
                                                                    {item.portion && (
                                                                        <span className="text-slate-500 text-[10px] ml-1">({item.portion})</span>
                                                                    )}
                                                                    {item.quantity && (
                                                                        <span className="text-slate-500 text-[10px] ml-1">- {item.quantity}</span>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center">
                                                            <span className="text-xs text-slate-400 italic">
                                                                {isDietPublished ? 'No items' : 'No diet'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

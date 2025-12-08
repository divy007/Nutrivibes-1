import { useMemo } from 'react';
import { WeekPlan, FoodItem, DayPlan } from '../types';
import { ChevronLeft, ChevronRight, Plus, Pencil } from 'lucide-react';
import { format, isSameDay, startOfDay, addDays } from 'date-fns';

interface DietCalendarProps {
    weekPlan: WeekPlan;
    onMealEdit: (date: Date, mealTime: string, currentItems: FoodItem[]) => void;
    onMealAdd: (date: Date, mealTime: string) => void;
    onWeekChange: (direction: 'prev' | 'next') => void;
}

import { MEAL_SLOTS } from '../data/meals';

export const DietCalendar: React.FC<DietCalendarProps> = ({
    weekPlan,
    onMealEdit,
    onMealAdd,
    onWeekChange
}) => {
    // Generate the 7 days of the current view based on weekPlan.startDate
    const weekDays = useMemo(() => {
        const start = startOfDay(new Date(weekPlan.startDate));
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [weekPlan.startDate]);

    const getMealForSlot = (dayPlan: DayPlan | undefined, time: string) => {
        return dayPlan?.meals.find(m => m.time === time);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header / Week Navigation */}
            <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm sticky top-0 z-10">
                <h2 className="text-xl font-bold text-slate-800">Diet Plan</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onWeekChange('prev')}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        title="Previous Week"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <span className="text-lg font-medium text-slate-700">
                        {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
                    </span>
                    <button
                        onClick={() => onWeekChange('next')}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        title="Next Week"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-7 gap-4 min-w-[1200px]">
                    {/* Day Columns */}
                    {weekDays.map((date) => {
                        const dayPlan = weekPlan.days.find(d => isSameDay(new Date(d.date), date));
                        const isToday = isSameDay(new Date(), date);

                        return (
                            <div key={date.toISOString()} className="flex flex-col gap-3">
                                {/* Date Header */}
                                <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600'} border`}>
                                    <div className="text-sm font-semibold uppercase">{format(date, 'EEE')}</div>
                                    <div className="text-2xl font-bold">{format(date, 'd')}</div>
                                </div>

                                {/* Meal Slots */}
                                <div className="flex flex-col gap-3">
                                    {MEAL_SLOTS.map((slot, index) => {
                                        const meal = getMealForSlot(dayPlan, slot.time);
                                        const hasFood = meal && meal.foodItems.length > 0;

                                        return (
                                            <div
                                                key={`${date.toISOString()}-${slot.time}`}
                                                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-40 overflow-hidden group"
                                            >
                                                {/* Slot Header */}
                                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs text-slate-500">
                                                    <span className="font-medium text-slate-700">#{index + 1} {slot.time}</span>
                                                    {/* Action Buttons */}
                                                    {hasFood ? (
                                                        <button
                                                            onClick={() => meal && onMealEdit(date, slot.time, meal.foodItems)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                                                            title="Edit Meal"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => onMealAdd(date, slot.time)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-100 text-indigo-600 rounded transition-all"
                                                            title="Add Food"
                                                        >
                                                            <Plus className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Slot Content */}
                                                <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
                                                    {hasFood ? (
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {meal.foodItems.map((item, idx) => (
                                                                <li key={idx} className="text-xs text-slate-700 leading-tight">
                                                                    <span className="font-medium">{item.name}</span>
                                                                    <span className="text-slate-500 text-[10px] ml-1">({item.portion})</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center">
                                                            <button
                                                                onClick={() => onMealAdd(date, slot.time)}
                                                                className="text-xs text-slate-400 hover:text-indigo-500 flex items-center gap-1 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3" /> Add
                                                            </button>
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

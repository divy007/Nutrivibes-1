import { useMemo, useState } from 'react';
import { WeekPlan, FoodItem, DayPlan } from '@/types';
import { ChevronLeft, ChevronRight, Plus, Pencil, Eye, Edit3 } from 'lucide-react';
import { format, isSameDay, startOfDay, addDays } from 'date-fns';
import { ClientDietCalendar } from '@/components/client/ClientDietCalendar';

interface DietCalendarProps {
    weekPlan: WeekPlan;
    onMealEdit: (date: Date, mealTime: string, currentItems: FoodItem[]) => void;
    onMealAdd: (date: Date, mealTime: string) => void;
    onWeekChange: (direction: 'prev' | 'next') => void;
}

// Dynamic meal names by number
const MEAL_NAMES_BY_NUMBER: Record<number, string> = {
  1: 'Early Morning',
  2: 'Breakfast',
  3: 'Mid-Morning',
  4: 'Lunch',
  5: 'Evening',
  6: 'Dinner',
  // Extend as needed
};

// Convert 24h to 12h format
const formatTimeTo12Hour = (timeStr: string): string => {
  if (/am|pm/i.test(timeStr)) return timeStr;
  const [hourStr, minute] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour.toString().padStart(2, '0')}:${minute} ${period}`;
};

export const DietCalendar: React.FC<DietCalendarProps> = ({
    weekPlan,
    onMealEdit,
    onMealAdd,
    onWeekChange
}) => {
    const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');

    // Generate the 7 days of the current view based on weekPlan.startDate
    const weekDays = useMemo(() => {
        const start = startOfDay(new Date(weekPlan.startDate));
        return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    }, [weekPlan.startDate]);

    const clientWeekPlan = useMemo(() => {
        return {
            weekStartDate: new Date(weekPlan.startDate),
            days: (weekPlan.days || []).map((d: any) => ({
                date: new Date(d.date),
                meals: d.meals || [],
                status: d.status || 'NO_DIET'
            }))
        };
    }, [weekPlan]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header / Week Navigation */}
            <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Diet Plan</h2>
                    
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setViewMode('editor')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'editor'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editor Mode
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                viewMode === 'preview'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Eye className="w-3.5 h-3.5" />
                            Customer View
                        </button>
                    </div>
                </div>

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

            {viewMode === 'preview' ? (
                <div className="flex-1 overflow-auto p-4">
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 rounded-lg mb-4 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold">🔒 Read-Only Customer View: Live client app view (editing disabled). Switch to Editor Mode to make changes.</span>
                    </div>
                    <ClientDietCalendar weekPlan={clientWeekPlan} onWeekChange={onWeekChange} />
                </div>
            ) : (
                /* Calendar Grid */
                <div className="flex-1 overflow-auto p-4">

                <div className="grid grid-cols-7 gap-4 min-w-[1200px]">
                    {/* Day Columns */}
                    {weekDays.map((date) => {
                        const dayPlan = weekPlan.days.find(d => isSameDay(new Date(d.date), date));
                        const isToday = isSameDay(new Date(), date);

                        return (
                            <div key={date.toISOString()} className="flex flex-col gap-3">
                                {/* Date Header */}
                                <div className={`text-center p-2 rounded-lg ${isToday ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-600'} border`}>
                                    <div className="text-sm font-semibold uppercase">{format(date, 'EEE')}</div>
                                    <div className="text-2xl font-bold">{format(date, 'd')}</div>
                                </div>

                                {/* Meal Slots */}
                                <div className="flex flex-col gap-3">
                                    {(() => {
    // Build slots from existing meals or placeholders
    const meals = dayPlan?.meals?.slice().sort((a, b) => a.mealNumber - b.mealNumber) || [];
    const maxSlots = Math.max(meals.length, 6);
    const slots = [];
    for (let i = 1; i <= maxSlots; i++) {
        const meal = meals.find(m => m.mealNumber === i);
        slots.push({
            mealNumber: i,
            time: meal?.time || `${i < 12 ? `0${i}` : i}:00`,
            foodItems: meal?.foodItems || [],
        });
    }
    return slots.map((slot) => {
        const hasFood = slot.foodItems.length > 0;
        return (
            <div
                key={`${date.toISOString()}-slot-${slot.mealNumber}`}
                className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-40 overflow-hidden group"
            >
                {/* Slot Header */}
                <div className="px-3 py-2 bg-slate-50 border-b flex justify-between items-center text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                        #{slot.mealNumber} {formatTimeTo12Hour(slot.time)}{' '}
                        <span className="ml-2 text-slate-600">{MEAL_NAMES_BY_NUMBER[slot.mealNumber] || `Meal ${slot.mealNumber}`}</span>
                    </span>
                    {hasFood ? (
                        <button
                            onClick={() => onMealEdit(date, slot.time, slot.foodItems)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                            title="Edit Meal"
                        >
                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                    ) : (
                        <button
                            onClick={() => onMealAdd(date, slot.time)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-emerald-100 text-emerald-600 rounded transition-all"
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
                            {slot.foodItems.map((item, idx) => (
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
                            <button
                                onClick={() => onMealAdd(date, slot.time)}
                                className="text-xs text-slate-400 hover:text-emerald-500 flex items-center gap-1 transition-colors"
                            >
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    });
})()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            )}
        </div>
    );
};


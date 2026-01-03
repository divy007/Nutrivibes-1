'use client';

import React, { useState, useEffect, useCallback, use, useRef } from 'react';
import { format, addDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Copy,
    Trash2,
    Repeat,
    Loader2,
    Download,
    ChevronDown,
    Plus,
    Clock,
    FileText,
    ExternalLink,
    FileSpreadsheet,
    MoreVertical,
    ArrowUpToLine,
    ArrowDownToLine,
    X,
    ClipboardPaste,
    Eye
} from 'lucide-react';

import { MealCard } from '@/components/dietician/plan/MealCard';
import { AddFoodModal } from '@/components/dietician/plan/AddFoodModal';
import { UpdateMealTimingsModal } from '@/components/dietician/plan/UpdateMealTimingsModal';
import { WeekPlan, ClientInfo, FoodItem, DayPlan, MealSlot, MealTiming } from '@/types';
import { exportToPDF, exportToExcel } from '@/utils/export';
import { api } from '@/lib/api-client';
import { CounsellingDrawer } from '@/components/dietician/client/CounsellingDrawer';
import { FollowUpNotesSection } from '@/components/dietician/client/FollowUpNotesSection';
import { FollowUpHistoryDrawer } from '@/components/dietician/client/FollowUpHistoryDrawer';

const DEFAULT_MEAL_TIMINGS: MealTiming[] = [
    { mealNumber: 1, time: '06:30' },
    { mealNumber: 2, time: '09:30' },
    { mealNumber: 3, time: '11:00' },
    { mealNumber: 4, time: '14:00' },
    { mealNumber: 5, time: '17:00' },
    { mealNumber: 6, time: '20:00' },
    { mealNumber: 7, time: '22:00' },
];

export default function SuggestDietPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    // --- State ---
    const [isCounsellingOpen, setIsCounsellingOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);


    // --- State ---
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [mealTimings, setMealTimings] = useState<MealTiming[]>(DEFAULT_MEAL_TIMINGS);
    const mealTimingsRef = useRef<MealTiming[]>(DEFAULT_MEAL_TIMINGS);

    useEffect(() => {
        mealTimingsRef.current = mealTimings;
    }, [mealTimings]);

    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);

    // --- Fetch Client and Diet Plan ---
    const fetchDietPlan = useCallback(async (clientId: string, startDate: Date) => {
        setLoadingPlan(true);
        try {
            const formattedDate = format(startDate, 'yyyy-MM-dd');
            const data = await api.get<any>(`/api/clients/${clientId}/diet-plan?startDate=${formattedDate}`);

            if (data && data.days) {
                // Determine the base structure from state/ref
                let currentTimings = [...mealTimingsRef.current];

                // If plan exists, sync meal timings BUT avoid downgrading structure
                if (data.days.length > 0 && data.days[0].meals) {
                    const savedTimings: MealTiming[] = data.days[0].meals.map((m: any) => ({
                        mealNumber: m.mealNumber,
                        time: m.time
                    }));

                    // Only update state if saved plan has a DIFFERENT structure (e.g. more meals or different times)
                    // We avoid downgrading length to persist the target "8th meal" even if current week only has 7
                    const isDifferent = savedTimings.length !== currentTimings.length ||
                        savedTimings.some((t, i) => t.time !== currentTimings[i]?.time || t.mealNumber !== currentTimings[i]?.mealNumber);

                    if (isDifferent) {
                        // If it's different, we might need to update state,
                        // but if state is already longer (has 8) and saved is shorter (has 7), we keep 8.
                        if (savedTimings.length >= currentTimings.length) {
                            setMealTimings(savedTimings);
                            currentTimings = savedTimings;
                        }
                    }
                }

                // If plan exists, use it and merge with current structure to ensure all rows appear
                setWeekPlan({
                    id: data._id,
                    clientInfo: clientInfo!,
                    startDate: new Date(data.weekStartDate),
                    endDate: addDays(new Date(data.weekStartDate), 6),
                    days: data.days.map((d: any) => {
                        const mergedMeals = currentTimings.map((timing, idx) => {
                            const existingMeal = d.meals[idx];
                            if (existingMeal) {
                                return { ...existingMeal, time: timing.time, mealNumber: timing.mealNumber };
                            }
                            return {
                                time: timing.time,
                                mealNumber: timing.mealNumber,
                                foodItems: []
                            };
                        });

                        return {
                            ...d,
                            date: new Date(d.date),
                            meals: mergedMeals,
                            status: d.status || (d.meals.some((m: any) => m.foodItems.length > 0) ? 'NOT_SAVED' : 'NO_DIET')
                        };
                    })
                });
            } else {
                // Otherwise generate blank
                setWeekPlan(generateWeekPlan(startDate, clientInfo!, mealTimingsRef.current));
            }
        } catch (error) {
            console.error('Failed to fetch diet plan:', error);
            // Fallback to blank on error
            if (clientInfo) {
                setWeekPlan(generateWeekPlan(startDate, clientInfo, mealTimingsRef.current));
            }
        } finally {
            setLoadingPlan(false);
        }
    }, [clientInfo]);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await api.get<any>(`/api/clients/${id}`);
                const info = {
                    _id: data._id,
                    id: data.clientId || `#${data._id.slice(-8)}`,
                    name: data.name,
                    email: data.email,
                    age: data.age,
                    gender: data.gender,
                    height: data.height,
                    weight: data.weight,
                    phone: data.phone,
                    preferences: data.dietaryPreferences?.join(', ') || 'None',
                    mealTimings: data.mealTimings,
                    status: data.status,
                    counsellingProfile: data.counsellingProfile,
                    followUpHistory: data.followUpHistory || []
                };
                if (data.mealTimings && data.mealTimings.length > 0) {
                    setMealTimings(data.mealTimings);
                    mealTimingsRef.current = data.mealTimings;
                }
                setClientInfo(info);

                if (data.dietStartDate) {
                    const start = startOfWeek(new Date(data.dietStartDate), { weekStartsOn: 1 });
                    setCurrentWeekStart(start);
                    // Initial diet fetch will be triggered by the next useEffect
                } else {
                    // If no diet start date, use today's week start
                    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
                    setCurrentWeekStart(today);
                }
            } catch (error) {
                console.error('Failed to fetch client for diet planner:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchClient();
    }, [id]);

    useEffect(() => {
        if (clientInfo && currentWeekStart) {
            fetchDietPlan(id, currentWeekStart);
        }
    }, [currentWeekStart, clientInfo?.id, fetchDietPlan]);

    const generateWeekPlan = useCallback((startDate: Date, client: ClientInfo, timings: MealTiming[]): WeekPlan => {
        const days: DayPlan[] = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(startDate, i);
            const meals: MealSlot[] = timings.map((timing) => ({
                time: timing.time,
                mealNumber: timing.mealNumber,
                foodItems: []
            }));
            days.push({ date, meals, status: 'NO_DIET' });
        }

        return {
            id: Math.random().toString(36).substr(2, 9),
            clientInfo: client,
            startDate,
            endDate: addDays(startDate, 6),
            days
        };
    }, []);

    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        dayIndex: number | null;
        mealIndex: number | null;
        existingItems: FoodItem[];
        mealTime: string;
    }>({
        isOpen: false,
        dayIndex: null,
        mealIndex: null,
        existingItems: [],
        mealTime: ''
    });

    const [isTimingsModalOpen, setIsTimingsModalOpen] = useState(false);
    const [actionState, setActionState] = useState<{
        type: 'copy' | 'swap' | null;
        sourceType: 'row' | 'col' | 'slot' | null;
        sourceIndex: number | null;
        sourceSlot?: { dayIndex: number; mealIndex: number };
    }>({ type: null, sourceType: null, sourceIndex: null });

    const [isExportOpen, setIsExportOpen] = useState(false);
    const [isActionOpen, setIsActionOpen] = useState(false);
    const [activeDayMenu, setActiveDayMenu] = useState<number | null>(null);
    const [copiedWeekPlan, setCopiedWeekPlan] = useState<DayPlan[] | null>(null);

    // Persist copied week plan to localStorage
    useEffect(() => {
        const saved = localStorage.getItem('nv_copied_week_plan');
        if (saved) {
            try {
                setCopiedWeekPlan(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse saved week plan');
            }
        }
    }, []);

    useEffect(() => {
        if (copiedWeekPlan) {
            localStorage.setItem('nv_copied_week_plan', JSON.stringify(copiedWeekPlan));
        } else {
            localStorage.removeItem('nv_copied_week_plan');
        }
    }, [copiedWeekPlan]);

    const exportRef = useRef<HTMLDivElement>(null);
    const actionRef = useRef<HTMLDivElement>(null);
    const dayMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
            if (actionRef.current && !actionRef.current.contains(event.target as Node)) {
                setIsActionOpen(false);
            }
            if (dayMenuRef.current && !dayMenuRef.current.contains(event.target as Node)) {
                setActiveDayMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- Handlers ---
    const handleWeekNavigation = (direction: 'PREV' | 'NEXT') => {
        setCurrentWeekStart(prev => direction === 'PREV' ? subWeeks(prev, 1) : addWeeks(prev, 1));
    };

    const handleAddFood = (dayIndex: number, mealIndex: number, time: string) => {
        setModalState({
            isOpen: true,
            dayIndex,
            mealIndex,
            existingItems: [],
            mealTime: time
        });
    };

    const handleEditFood = (dayIndex: number, mealIndex: number, existingItems: FoodItem[], time: string) => {
        setModalState({
            isOpen: true,
            dayIndex,
            mealIndex,
            existingItems,
            mealTime: time
        });
    };

    const handleCloseModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    };

    const handleSaveFood = (selectedItems: FoodItem[], repeatStrategy: 'date' | 'weekly' | 'custom', selectedDays?: number[]) => {
        const { dayIndex, mealIndex } = modalState;
        if (dayIndex === null || mealIndex === null || !weekPlan) return;

        const newDays = [...weekPlan.days];

        const applyToDay = (idx: number) => {
            const newMeals = [...newDays[idx].meals];
            newMeals[mealIndex] = {
                ...newMeals[mealIndex],
                foodItems: selectedItems
            };
            newDays[idx] = {
                ...newDays[idx],
                meals: newMeals,
                status: 'NOT_SAVED'
            };
        };

        if (repeatStrategy === 'date') {
            applyToDay(dayIndex);
        } else if (repeatStrategy === 'weekly') {
            for (let i = 0; i < 7; i++) applyToDay(i);
        } else if (repeatStrategy === 'custom' && selectedDays) {
            selectedDays.forEach(idx => { if (idx >= 0 && idx < 7) applyToDay(idx); });
        }

        setWeekPlan({ ...weekPlan, days: newDays });
        autoSavePlan(newDays);
        handleCloseModal();
    };

    const handleUpdateTimings = async (newTimings: MealTiming[]) => {
        setMealTimings(newTimings);
        if (weekPlan) {
            const newDays = weekPlan.days.map(day => {
                const newMeals = newTimings.map((timing, idx) => {
                    const existingMeal = day.meals[idx];
                    if (existingMeal) return { ...existingMeal, time: timing.time, mealNumber: timing.mealNumber };
                    return { time: timing.time, mealNumber: timing.mealNumber, foodItems: [] };
                });
                return { ...day, meals: newMeals };
            });
            setWeekPlan({ ...weekPlan, days: newDays });
        }
        try {
            await api.patch(`/api/clients/${id}`, { mealTimings: newTimings });
        } catch (error) {
            console.error('Failed to update global meal timings:', error);
        }
    };

    const autoSavePlan = async (days: DayPlan[]) => {
        try {
            const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
            await api.post(`/api/clients/${id}/diet-plan`, {
                weekStartDate: formattedStartDate,
                days: days
            });
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    };

    const handleAction = async (
        type: 'copy' | 'swap' | 'delete',
        sourceType: 'row' | 'col' | 'slot',
        index?: number,
        slot?: { dayIndex: number, mealIndex: number }
    ) => {
        if (!weekPlan) return;

        // --- DELETE ACTION ---
        if (type === 'delete') {
            const newPlan = JSON.parse(JSON.stringify(weekPlan));
            if (sourceType === 'col' && index !== undefined) {
                if (newPlan.days[index].status === 'PUBLISHED') {
                    alert('Cannot delete food from a published day. Please unpublish first.');
                    return;
                }
                newPlan.days[index].meals = newPlan.days[index].meals.map((m: any) => ({ ...m, foodItems: [] }));
                newPlan.days[index].status = 'NO_DIET';
            } else if (sourceType === 'row' && index !== undefined) {
                let blockedByPublished = false;
                newPlan.days.forEach((day: any) => {
                    if (day.status === 'PUBLISHED' && day.meals[index]?.foodItems.length > 0) blockedByPublished = true;
                });
                if (blockedByPublished) {
                    alert('Cannot delete row: One or more days are published.');
                    return;
                }
                newPlan.days.forEach((day: any) => {
                    if (day.meals[index]) {
                        day.meals[index].foodItems = [];
                        if (day.status !== 'PUBLISHED' && day.status !== 'NO_DIET') {
                            day.status = day.meals.some((m: any) => m.foodItems.length > 0) ? 'NOT_SAVED' : 'NO_DIET';
                        }
                    }
                });
            } else if (sourceType === 'slot' && slot) {
                if (newPlan.days[slot.dayIndex].status === 'PUBLISHED') {
                    alert('Cannot delete from a published day.');
                    return;
                }
                newPlan.days[slot.dayIndex].meals[slot.mealIndex].foodItems = [];
                const day = newPlan.days[slot.dayIndex];
                day.status = day.meals.some((m: any) => m.foodItems.length > 0) ? 'NOT_SAVED' : 'NO_DIET';
            }
            setWeekPlan(newPlan);
            autoSavePlan(newPlan.days);
            return;
        }

        // --- COPY / SWAP ACTION ---

        // If clicking the same item again, cancel the action
        const isSame = actionState.type === type && actionState.sourceType === sourceType && (
            sourceType === 'slot'
                ? (actionState.sourceSlot?.dayIndex === slot?.dayIndex && actionState.sourceSlot?.mealIndex === slot?.mealIndex)
                : actionState.sourceIndex === index
        );

        if (isSame) {
            setActionState({ type: null, sourceType: null, sourceIndex: null });
            return;
        }

        // If no source is selected, select this as the source
        if (!actionState.type) {
            setActionState({ type, sourceType, sourceIndex: index ?? null, sourceSlot: slot });
            return;
        }

        // --- Destination Selection logic ---
        if (actionState.type === type && actionState.sourceType === sourceType) {
            const newPlan = JSON.parse(JSON.stringify(weekPlan));

            if (sourceType === 'col' && index !== undefined) {
                const srcIdx = actionState.sourceIndex!;
                const destIdx = index;
                if (newPlan.days[destIdx].status === 'PUBLISHED' || (type === 'swap' && newPlan.days[srcIdx].status === 'PUBLISHED')) {
                    alert('Action blocked: Destination or source day is published.');
                    return;
                }
                if (type === 'swap') {
                    const temp = JSON.parse(JSON.stringify(newPlan.days[srcIdx].meals));
                    newPlan.days[srcIdx].meals = JSON.parse(JSON.stringify(newPlan.days[destIdx].meals));
                    newPlan.days[destIdx].meals = temp;
                    newPlan.days[srcIdx].status = 'NOT_SAVED';
                } else {
                    newPlan.days[destIdx].meals = JSON.parse(JSON.stringify(newPlan.days[srcIdx].meals)).map((m: any, i: number) => ({
                        ...m,
                        time: newPlan.days[destIdx].meals[i].time,
                        mealNumber: newPlan.days[destIdx].meals[i].mealNumber
                    }));
                }
                newPlan.days[destIdx].status = 'NOT_SAVED';

            } else if (sourceType === 'row' && index !== undefined) {
                const srcIdx = actionState.sourceIndex!;
                const destIdx = index;
                let blocked = false;
                newPlan.days.forEach((day: any) => { if (day.status === 'PUBLISHED') blocked = true; });
                if (blocked) { alert('Action spans across published days.'); return; }

                newPlan.days.forEach((day: any) => {
                    if (type === 'swap') {
                        const temp = JSON.parse(JSON.stringify(day.meals[srcIdx].foodItems));
                        day.meals[srcIdx].foodItems = JSON.parse(JSON.stringify(day.meals[destIdx].foodItems));
                        day.meals[destIdx].foodItems = temp;
                    } else {
                        day.meals[destIdx].foodItems = JSON.parse(JSON.stringify(day.meals[srcIdx].foodItems));
                    }
                    if (day.status !== 'NO_DIET') day.status = 'NOT_SAVED';
                    else if (day.meals.some((m: any) => m.foodItems.length > 0)) day.status = 'NOT_SAVED';
                });

            } else if (sourceType === 'slot' && slot) {
                const src = actionState.sourceSlot!;
                const dest = slot;
                if (newPlan.days[dest.dayIndex].status === 'PUBLISHED' || (type === 'swap' && newPlan.days[src.dayIndex].status === 'PUBLISHED')) {
                    alert('Action blocked: Destination or source day is published.');
                    return;
                }

                if (type === 'swap') {
                    const temp = JSON.parse(JSON.stringify(newPlan.days[src.dayIndex].meals[src.mealIndex].foodItems));
                    newPlan.days[src.dayIndex].meals[src.mealIndex].foodItems = JSON.parse(JSON.stringify(newPlan.days[dest.dayIndex].meals[dest.mealIndex].foodItems));
                    newPlan.days[dest.dayIndex].meals[dest.mealIndex].foodItems = temp;
                    newPlan.days[src.dayIndex].status = 'NOT_SAVED';
                } else {
                    newPlan.days[dest.dayIndex].meals[dest.mealIndex].foodItems = JSON.parse(JSON.stringify(newPlan.days[src.dayIndex].meals[src.mealIndex].foodItems));
                }
                newPlan.days[dest.dayIndex].status = 'NOT_SAVED';
            }

            setWeekPlan(newPlan);
            autoSavePlan(newPlan.days);

            // For 'copy', we keep the source active to allow pasting in multiple places
            // For 'swap' or 'delete' (though delete is handled above), we reset.
            if (type === 'swap') {
                setActionState({ type: null, sourceType: null, sourceIndex: null });
            }
        } else {
            // If sourceType changed (e.g. from row to col), start over
            setActionState({ type, sourceType, sourceIndex: index ?? null, sourceSlot: slot });
        }
    };

    const handleCopyEntireWeek = () => {
        if (!weekPlan) return;
        setCopiedWeekPlan(JSON.parse(JSON.stringify(weekPlan.days)));
    };

    const handlePasteEntireWeek = async () => {
        if (!weekPlan || !copiedWeekPlan) return;

        const newPlan = JSON.parse(JSON.stringify(weekPlan));
        let anyChanges = false;

        newPlan.days = newPlan.days.map((day: DayPlan, dayIdx: number) => {
            if (day.status === 'PUBLISHED') return day;

            const copiedDay = copiedWeekPlan[dayIdx];
            if (!copiedDay) return day;

            anyChanges = true;
            return {
                ...day,
                meals: day.meals.map((meal: MealSlot, mealIdx: number) => {
                    const copiedMeal = copiedDay.meals[mealIdx];
                    if (!copiedMeal) return meal;
                    return {
                        ...meal,
                        foodItems: JSON.parse(JSON.stringify(copiedMeal.foodItems))
                    };
                }),
                status: 'NOT_SAVED'
            };
        });

        if (anyChanges) {
            setWeekPlan(newPlan);
            try {
                const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
                await api.post(`/api/clients/${id}/diet-plan`, {
                    weekStartDate: formattedStartDate,
                    days: newPlan.days
                });
            } catch (error) {
                alert('Pasted plan successfully but failed to auto-save. Please use "Save as Draft"');
            }
        }
    };

    const handlePublishDay = async (dayIndex: number) => {
        if (!weekPlan) return;
        const newDays = [...weekPlan.days];
        newDays[dayIndex] = { ...newDays[dayIndex], status: 'PUBLISHED' };

        try {
            const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
            await api.post(`/api/clients/${id}/diet-plan`, {
                weekStartDate: formattedStartDate,
                days: newDays
            });
            setWeekPlan(prev => prev ? { ...prev, days: newDays } : null);
            setActiveDayMenu(null);
        } catch (error) {
            alert('Failed to publish column');
        }
    };

    const handleUnpublishDay = async (dayIndex: number) => {
        if (!weekPlan) return;
        const newDays = [...weekPlan.days];
        const hasFood = newDays[dayIndex].meals.some(m => m.foodItems.length > 0);
        newDays[dayIndex] = { ...newDays[dayIndex], status: hasFood ? 'NOT_SAVED' : 'NO_DIET' };

        try {
            const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
            await api.post(`/api/clients/${id}/diet-plan`, {
                weekStartDate: formattedStartDate,
                days: newDays
            });
            setWeekPlan(prev => prev ? { ...prev, days: newDays } : null);
            setActiveDayMenu(null);
        } catch (error) {
            alert('Failed to unpublish column');
        }
    };

    const handleSaveAsDraft = async () => {
        if (!weekPlan) return;
        try {
            const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
            await api.post(`/api/clients/${id}/diet-plan`, {
                weekStartDate: formattedStartDate,
                days: weekPlan.days
            });
            alert('Draft saved successfully');
        } catch (error) {
            alert('Failed to save draft');
        }
    };

    const handleSaveAndPublish = async () => {
        if (!weekPlan) return;
        const newDays = weekPlan.days.map(day => ({
            ...day,
            status: day.meals.some(m => m.foodItems.length > 0) ? 'PUBLISHED' as const : day.status
        }));

        try {
            const formattedStartDate = format(currentWeekStart, 'yyyy-MM-dd');
            await api.post(`/api/clients/${id}/diet-plan`, {
                weekStartDate: formattedStartDate,
                days: newDays
            });
            setWeekPlan(prev => prev ? { ...prev, days: newDays } : null);
            alert('All diets with food have been published and are now visible to the client.');
        } catch (error) {
            alert('Failed to save and publish');
        }
    };

    const handleSaveFollowUpNotes = async (data: { notes: string }) => {
        setIsSavingNotes(true);
        try {
            await api.post(`/api/clients/${id}/follow-up`, data);

            // Re-fetch client data to update history
            const updatedData = await api.get<any>(`/api/clients/${id}`);
            setClientInfo(prev => prev ? {
                ...prev,
                followUpHistory: updatedData.followUpHistory || []
            } : null);

            setIsNotesOpen(false);
            alert('Notes saved to history');
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Failed to save notes');
        } finally {
            setIsSavingNotes(false);
        }
    };

    if (loading || !weekPlan) {
        return (
            <div className="flex h-full items-center justify-center p-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Week Navigation & Context Actions */}
                <div className="flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleWeekNavigation('PREV')}
                            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700 text-lg uppercase tracking-tight">
                                {format(currentWeekStart, 'dd MMM yyyy')} - {format(addDays(currentWeekStart, 6), 'dd MMM yyyy')}
                            </span>
                        </div>

                        <button
                            onClick={() => handleWeekNavigation('NEXT')}
                            className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Export Button */}
                        <div className="relative" ref={exportRef}>
                            <button
                                onClick={() => setIsExportOpen(!isExportOpen)}
                                className="p-2.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors border border-slate-100 shadow-sm"
                                title="Export Diet Plan"
                            >
                                <Download size={20} />
                            </button>
                            {isExportOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 py-1.5 z-50">
                                    <button
                                        onClick={() => { exportToPDF(weekPlan, clientInfo!); setIsExportOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                    >
                                        <FileText className="w-4 h-4 text-red-500" />
                                        <span>Export PDF</span>
                                    </button>
                                    <button
                                        onClick={() => { exportToExcel(weekPlan, clientInfo!); setIsExportOpen(false); }}
                                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                    >
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                        <span>Export Excel</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={copiedWeekPlan ? () => setCopiedWeekPlan(null) : handleCopyEntireWeek}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${copiedWeekPlan
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                title={copiedWeekPlan ? "Click to clear copied plan" : "Copy Entire Week Plan"}
                            >
                                <Copy size={14} />
                                <span>{copiedWeekPlan ? 'Plan Copied' : 'Copy Week'}</span>
                            </button>

                            {copiedWeekPlan && (
                                <button
                                    onClick={handlePasteEntireWeek}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-95 animate-in fade-in slide-in-from-right-2"
                                    title="Paste Copied Week to This Week"
                                >
                                    <ClipboardPaste size={14} />
                                    <span>Paste Week</span>
                                </button>
                            )}

                            {actionState.type && (
                                <button
                                    onClick={() => setActionState({ type: null, sourceType: null, sourceIndex: null })}
                                    className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100 transition-all flex items-center gap-2 animate-in fade-in slide-in-from-right-2"
                                >
                                    <X size={14} />
                                    Cancel {actionState.type === 'copy' ? 'Copy' : 'Swap'}
                                </button>
                            )}

                            <button
                                onClick={() => setIsCounsellingOpen(true)}
                                className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Eye size={14} />
                                Counselling
                            </button>

                            <button
                                onClick={() => setIsNotesOpen(!isNotesOpen)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-sm border ${isNotesOpen
                                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                <Plus size={14} />
                                {isNotesOpen ? 'Hide Notes' : 'Add Notes'}
                            </button>

                            <div className="relative" ref={actionRef}>
                                <button
                                    onClick={() => setIsActionOpen(!isActionOpen)}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all font-bold shadow-md hover:shadow-lg active:scale-95 text-sm"
                                >
                                    Action
                                    <ChevronDown size={16} />
                                </button>
                                {isActionOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50 flex items-center gap-3 transition-colors">
                                            <Plus size={16} className="text-orange-500" />
                                            <span className="font-semibold">Add Meal</span>
                                        </button>
                                        <button
                                            onClick={() => { setIsTimingsModalOpen(true); setIsActionOpen(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-orange-50 flex items-center gap-3 transition-colors"
                                        >
                                            <Clock size={16} className="text-orange-500" />
                                            <span className="font-semibold">Add Meal Timing</span>
                                        </button>
                                        <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                        <button
                                            onClick={() => { handleSaveAsDraft(); setIsActionOpen(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                        >
                                            <FileText size={16} className="text-blue-500" />
                                            <span>Save Weekly Diet</span>
                                        </button>
                                        <button
                                            onClick={() => { setIsExportOpen(true); setIsActionOpen(false); }}
                                            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                        >
                                            <ExternalLink size={16} className="text-purple-500" />
                                            <span>Export Diet</span>
                                        </button>
                                        <button className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                                            <Trash2 size={16} />
                                            <span className="font-medium">Delete Diets</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Follow Up Notes Section */}
                <AnimatePresence>
                    {isNotesOpen && (
                        <FollowUpNotesSection
                            onSave={handleSaveFollowUpNotes}
                            isSaving={isSavingNotes}
                            onShowHistory={() => setIsHistoryOpen(true)}
                        />
                    )}
                </AnimatePresence>

                {/* Render Drawer */}
                <CounsellingDrawer
                    isOpen={isCounsellingOpen}
                    onClose={() => setIsCounsellingOpen(false)}
                    clientId={id}
                    clientData={clientInfo}
                    onUpdate={() => {
                        const fetchClient = async () => {
                            try {
                                const data = await api.get<any>(`/api/clients/${id}`);
                                setClientInfo(prev => prev ? { ...prev, counsellingProfile: data.counsellingProfile } : null);
                            } catch (e) { console.error('Failed to refresh data'); }
                        };
                        fetchClient();
                    }}
                />

                <FollowUpHistoryDrawer
                    isOpen={isHistoryOpen}
                    onClose={() => setIsHistoryOpen(false)}
                    history={clientInfo?.followUpHistory || []}
                />

                {/* Planner Grid */}
                <div className="overflow-x-auto pb-4 custom-scrollbar">
                    <div className="min-w-[1200px] flex flex-col gap-4">

                        {/* Headers */}
                        <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-4">
                            <div className="flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Day / Timing</span>
                            </div>
                            {weekPlan.days.map((day, dayIndex) => (
                                <div key={dayIndex} className={`p-4 bg-white rounded-lg border shadow-sm text-center transition-all relative ${actionState.sourceType === 'col' && actionState.sourceIndex === dayIndex ? 'ring-2 ring-orange-500 border-orange-200' : 'border-slate-200'}`}>
                                    {/* Status Badge */}
                                    <div className="mb-2">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border shadow-sm ${day.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700 border-emerald-300 ring-1 ring-emerald-500' :
                                            day.status === 'NOT_SAVED' ? 'bg-rose-50 text-rose-500 border-rose-100' :
                                                'bg-slate-100 text-slate-400 border-slate-200'
                                            }`}>
                                            {day.status === 'PUBLISHED' ? '✓ Published' : day.status === 'NOT_SAVED' ? 'Not Saved' : 'No Diet'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-center gap-1 mb-2">
                                        <button
                                            onClick={() => handleAction('copy', 'col', dayIndex)}
                                            disabled={day.status === 'PUBLISHED'}
                                            className={`p-1 rounded transition-colors ${day.status === 'PUBLISHED' ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-50'} ${actionState.type === 'copy' && actionState.sourceIndex === dayIndex ? 'text-orange-500' : 'text-slate-300'}`}
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleAction('swap', 'col', dayIndex)}
                                            disabled={day.status === 'PUBLISHED'}
                                            className={`p-1 rounded transition-colors ${day.status === 'PUBLISHED' ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-slate-50'} ${actionState.type === 'swap' && actionState.sourceIndex === dayIndex ? 'text-orange-500' : 'text-slate-300'}`}
                                        >
                                            <Repeat size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleAction('delete', 'col', dayIndex)}
                                            disabled={day.status === 'PUBLISHED'}
                                            className={`p-1 rounded transition-colors ${day.status === 'PUBLISHED' ? 'text-slate-200 cursor-not-allowed' : 'hover:bg-red-50 text-slate-300 hover:text-red-500'}`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={() => setActiveDayMenu(activeDayMenu === dayIndex ? null : dayIndex)}
                                                className="p-1 rounded hover:bg-slate-50 text-slate-300 hover:text-slate-600"
                                            >
                                                <MoreVertical size={12} />
                                            </button>
                                            {activeDayMenu === dayIndex && (
                                                <div ref={dayMenuRef} className="absolute left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                                                    <button
                                                        onClick={() => handlePublishDay(dayIndex)}
                                                        disabled={day.status === 'PUBLISHED'}
                                                        className={`w-full px-3 py-1.5 text-left text-[10px] font-bold flex items-center gap-3 transition-colors ${day.status === 'PUBLISHED' ? 'text-slate-300 cursor-not-allowed' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                                    >
                                                        <ArrowUpToLine size={12} className={day.status === 'PUBLISHED' ? 'text-slate-300' : 'text-emerald-600'} />
                                                        <span>Publish</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleUnpublishDay(dayIndex)}
                                                        disabled={day.status !== 'PUBLISHED'}
                                                        className={`w-full px-3 py-1.5 text-left text-[10px] font-bold flex items-center gap-3 transition-colors ${day.status !== 'PUBLISHED' ? 'text-slate-300 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'}`}
                                                    >
                                                        <ArrowDownToLine size={12} className={day.status !== 'PUBLISHED' ? 'text-slate-300' : 'text-rose-500'} />
                                                        <span>Un Publish</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 uppercase leading-none">{format(day.date, 'EEEE')}</div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{format(day.date, 'dd MMM')}</div>

                                    {/* Column Paste Overlay */}
                                    {actionState.type === 'copy' && actionState.sourceType === 'col' && actionState.sourceIndex !== dayIndex && day.status !== 'PUBLISHED' && (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleAction('copy', 'col', dayIndex); }}
                                            className="absolute inset-0 bg-orange-500/95 flex flex-col items-center justify-center cursor-pointer z-20 transition-all hover:bg-orange-600 animate-in fade-in zoom-in"
                                        >
                                            <ClipboardPaste className="w-6 h-6 text-white mb-1" />
                                            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Paste Here</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Meal Rows */}
                        {mealTimings.map((timing, mealIndex) => (
                            <div key={mealIndex} className="grid grid-cols-[140px_repeat(7,1fr)] gap-4 items-stretch">
                                <div className={`p-4 bg-white rounded-lg border shadow-sm flex flex-col items-center justify-center transition-all relative overflow-hidden ${actionState.sourceType === 'row' && actionState.sourceIndex === mealIndex ? 'ring-2 ring-orange-500 border-orange-200' : 'border-slate-200'}`}>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <button onClick={() => handleAction('copy', 'row', mealIndex)} className={`p-1 rounded hover:bg-slate-50 ${actionState.type === 'copy' && actionState.sourceIndex === mealIndex ? 'text-orange-500' : 'text-slate-300'}`}><Copy size={12} /></button>
                                        <button onClick={() => handleAction('swap', 'row', mealIndex)} className={`p-1 rounded hover:bg-slate-50 ${actionState.type === 'swap' && actionState.sourceIndex === mealIndex ? 'text-orange-500' : 'text-slate-300'}`}><Repeat size={12} /></button>
                                        <button onClick={() => handleAction('delete', 'row', mealIndex)} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Meal {timing.mealNumber}</div>
                                    <div className="text-sm font-bold text-slate-700">{timing.time}</div>

                                    {/* Row Paste Overlay */}
                                    {actionState.type === 'copy' && actionState.sourceType === 'row' && actionState.sourceIndex !== mealIndex && (
                                        <div
                                            onClick={(e) => { e.stopPropagation(); handleAction('copy', 'row', mealIndex); }}
                                            className="absolute inset-0 bg-orange-500/95 flex flex-col items-center justify-center cursor-pointer z-20 transition-all hover:bg-orange-600 animate-in fade-in zoom-in"
                                        >
                                            <ClipboardPaste className="w-5 h-5 text-white mb-1" />
                                            <span className="text-[9px] text-white font-bold uppercase tracking-wider">Paste Row</span>
                                        </div>
                                    )}
                                </div>

                                {weekPlan.days.map((day, dayIndex) => {
                                    const meal = day.meals[mealIndex];
                                    if (!meal) return <div key={`${dayIndex}-${mealIndex}`} className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200" />;

                                    const isSource = actionState.sourceType === 'slot' &&
                                        actionState.sourceSlot?.dayIndex === dayIndex &&
                                        actionState.sourceSlot?.mealIndex === mealIndex;

                                    return (
                                        <MealCard
                                            key={`${dayIndex}-${mealIndex}`}
                                            mealNumber={meal.mealNumber}
                                            time={meal.time}
                                            foodItems={meal.foodItems}
                                            onAddFood={() => handleAddFood(dayIndex, mealIndex, meal.time)}
                                            onEdit={() => handleEditFood(dayIndex, mealIndex, meal.foodItems, meal.time)}
                                            onCopy={() => handleAction('copy', 'slot', undefined, { dayIndex, mealIndex })}
                                            onSwap={() => handleAction('swap', 'slot', undefined, { dayIndex, mealIndex })}
                                            onDelete={() => handleAction('delete', 'slot', undefined, { dayIndex, mealIndex })}
                                            onPaste={() => handleAction('copy', 'slot', undefined, { dayIndex, mealIndex })}
                                            isActiveCopy={actionState.type === 'copy' && isSource}
                                            isActiveSwap={actionState.type === 'swap' && isSource}
                                            isPasteMode={actionState.type === 'copy' && actionState.sourceType === 'slot'}
                                            disabled={day.status === 'PUBLISHED'}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sticky Footer Actions */}
                <div className="fixed bottom-0 right-0 left-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 px-8 flex justify-end gap-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                    <button
                        onClick={handleSaveAsDraft}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        Save as Draft
                    </button>
                    <button
                        onClick={handleSaveAndPublish}
                        className="px-6 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all shadow-md active:scale-95 flex items-center gap-2"
                    >
                        Save & Publish
                    </button>
                </div>

                {/* Spacer for sticky footer */}
                <div className="h-24"></div>
            </div>

            {/* Modals */}
            <AddFoodModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                onAdd={handleSaveFood}
                existingItems={modalState.existingItems}
                mealTime={modalState.mealTime}
                mealCategory="Mixed"
                currentDate={modalState.dayIndex !== null && weekPlan ? weekPlan.days[modalState.dayIndex].date : undefined}
            />

            <UpdateMealTimingsModal
                isOpen={isTimingsModalOpen}
                onClose={() => setIsTimingsModalOpen(false)}
                onSave={handleUpdateTimings}
                currentTimings={mealTimings}
            />
        </div>
    );
}

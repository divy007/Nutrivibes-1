'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api, getAuthToken } from '@/lib/api-client';
import { ClientDietCalendar } from '@/components/client/ClientDietCalendar';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { parseToLocalDate } from '@/lib/date-utils';

interface MealSlot {
    time: string;
    mealNumber: number;
    foodItems: any[];
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

export default function ClientDietPlanPage() {
    const { user } = useAuth(true);
    const [weekPlan, setWeekPlan] = useState<ClientWeekPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Initialize view to the current week
    useEffect(() => {
        const initializeView = async () => {
            try {
                // Fetch the client profile to see if they have an anchored diet start date
                const profileData = await api.get<any>('/api/clients/me');
                let dietStart = null;
                if (profileData && profileData.dietStartDate) {
                    dietStart = parseToLocalDate(profileData.dietStartDate);
                }

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (dietStart) {
                    if (dietStart <= today) {
                        // Past or current diet: navigate to the week containing today
                        // anchored on the same day-of-week as dietStartDate
                        const startDayIndex = dietStart.getDay();
                        const currentDayIndex = today.getDay();
                        const diff = (currentDayIndex - startDayIndex + 7) % 7;
                        const startOfCurrentWeek = new Date(today);
                        startOfCurrentWeek.setDate(today.getDate() - diff);
                        setCurrentWeekStart(startOfCurrentWeek);
                    } else {
                        // Future diet: jump to diet start date
                        setCurrentWeekStart(dietStart);
                    }
                } else {
                    // No diet start date — use standard Monday-based week
                    setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
                }
            } catch (error) {
                console.error('Failed to load profile for diet week anchoring, falling back to Monday:', error);
                const today = new Date();
                setCurrentWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
            } finally {
                setIsInitialLoad(false);
            }
        };

        if (user) {
            initializeView();
        }
    }, [user]);

    const fetchDietPlan = async (weekStart: Date) => {
        setLoading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(
                `/api/client/diet-plan?startDate=${format(weekStart, 'yyyy-MM-dd')}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch diet plan');
            }

            const data = await response.json();

            if (data && data.weekStartDate) {
                setWeekPlan({
                    weekStartDate: parseToLocalDate(data.weekStartDate),
                    days: data.days.map((day: any) => ({
                        ...day,
                        date: parseToLocalDate(day.date)
                    }))
                });
            } else {
                // No diet plan found, create empty structure starting from requested date
                const days = Array.from({ length: 7 }).map((_, i) => {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(weekStart.getDate() + i);
                    return {
                        date: dayDate,
                        meals: [],
                        status: 'NO_DIET' as const
                    };
                });

                setWeekPlan({
                    weekStartDate: weekStart,
                    days: days
                });
            }
        } catch (error) {
            console.error('Failed to fetch diet plan:', error);
            // Set empty plan on error
            setWeekPlan({
                weekStartDate: weekStart,
                days: Array.from({ length: 7 }).map((_, i) => ({
                    date: new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000),
                    meals: [],
                    status: 'NO_DIET'
                }))
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && !isInitialLoad) {
            fetchDietPlan(currentWeekStart);
        }
    }, [user, currentWeekStart, isInitialLoad]);

    const handleWeekChange = (direction: 'prev' | 'next') => {
        // Shift by 7 days, maintaining the custom start day (e.g. Wednesday -> Wednesday)
        const newWeekStart = direction === 'prev'
            ? subWeeks(currentWeekStart, 1)
            : addWeeks(currentWeekStart, 1);
        setCurrentWeekStart(newWeekStart);
    };

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <img
                        src="/brand-logo.png"
                        alt="DateWithDiet"
                        className="h-20 w-auto mx-auto animate-pulse"
                    />
                    <Loader2 className="w-8 h-8 animate-spin text-brand-sage mx-auto" />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <ClientDietCalendar
                weekPlan={weekPlan}
                onWeekChange={handleWeekChange}
                loading={loading}
            />
        </div>
    );
}

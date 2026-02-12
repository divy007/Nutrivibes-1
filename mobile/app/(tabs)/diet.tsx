import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Clock } from 'lucide-react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { useIsFocused } from '@react-navigation/native';
import BookAppointmentModal from '@/components/dashboard/BookAppointmentModal';

const MEAL_SLOTS = [
    { time: '07:00 AM', name: 'Early Morning' },
    { time: '09:00 AM', name: 'Breakfast' },
    { time: '11:30 AM', name: 'Mid-Morning' },
    { time: '01:30 PM', name: 'Lunch' },
    { time: '04:30 PM', name: 'Evening' },
    { time: '08:30 PM', name: 'Dinner' },
];

export default function DietPlanScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekPlan, setWeekPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            ScreenCapture.preventScreenCaptureAsync();
        } else {
            ScreenCapture.allowScreenCaptureAsync();
        }
        return () => {
            ScreenCapture.allowScreenCaptureAsync();
        };
    }, [isFocused]);

    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];

    const getLocalDateFromStr = (dateStr: string) => {
        const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
        return new Date(y, m - 1, d);
    };

    const weekStart = React.useMemo(() => {
        if ((user as any)?.dietStartDate) {
            const dietStart = getLocalDateFromStr((user as any).dietStartDate);
            // Calculate the start of the week relative to the diet start day
            const startDayIndex = dietStart.getDay(); // 0-6
            const currentDayIndex = selectedDate.getDay();
            const diff = (currentDayIndex - startDayIndex + 7) % 7;
            const start = addDays(selectedDate, -diff);
            // strip time to be safe? usually handled by logic, but ensuring 00:00 might be good. 
            // actually selectedDate usually comes from state, best to just return the date object.
            return start;
        }
        return startOfWeek(selectedDate, { weekStartsOn: 1 });
    }, [selectedDate, user]);

    const weekDays = React.useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

    useEffect(() => {
        if (user) {
            // Check if diet starts in the future
            if ((user as any)?.dietStartDate) {
                const dietStart = getLocalDateFromStr((user as any).dietStartDate);
                const today = new Date();
                // Reset time components for accurate date comparison
                today.setHours(0, 0, 0, 0);

                // If diet starts in the future (strictly greater), jump to it so user sees the plan
                if (dietStart > today) {
                    setSelectedDate(dietStart);
                }
            }

            // We fetch the plan for the current week starting today.
            // The dietician-set start date is respected because the API 
            // will return 'NO_DIET' for days before the diet actually begins.
            fetchDietPlan();
        }
    }, [user]);

    // Re-fetch only when the user intentionally changes the week (by changing selectedDate)
    // We filter this to avoid double fetching on init, but for simplicity, useEffect dependency on weekStart is fine.
    useEffect(() => {
        if (user) {
            fetchDietPlan();
        }
    }, [weekStart]);

    const fetchDietPlan = async () => {
        setLoading(true);
        try {
            const startDateStr = format(weekStart, 'yyyy-MM-dd');
            const data = await api.get<any>(`/api/client/diet-plan?startDate=${startDateStr}`);

            if (data && data.days) {
                setWeekPlan(data);
            } else {
                setWeekPlan({
                    weekStartDate: weekStart,
                    days: Array.from({ length: 7 }).map((_, i) => ({
                        date: addDays(weekStart, i),
                        meals: [],
                        status: 'NO_DIET'
                    }))
                });
            }
        } catch (error) {
            console.error('Failed to fetch diet plan:', error);
            setWeekPlan({
                weekStartDate: weekStart,
                days: Array.from({ length: 7 }).map((_, i) => ({
                    date: addDays(weekStart, i),
                    meals: [],
                    status: 'NO_DIET'
                }))
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = React.useCallback(async () => {
        setRefreshing(true);
        try {
            await fetchDietPlan();
        } finally {
            setRefreshing(false);
        }
    }, [weekStart]);

    const dayPlan = weekPlan?.days?.find((d: any) => isSameDay(new Date(d.date), selectedDate));
    const isPublished = dayPlan?.status === 'PUBLISHED';

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 24 }]}>
            <View style={styles.header}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={[styles.title, { color: theme.brandForest }]}>Daily Nutrition</Text>
                        <Text style={styles.subtitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => setSelectedDate(prev => addDays(prev, -7))}
                            style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
                        >
                            <ChevronsLeft size={20} color={theme.brandForest} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSelectedDate(prev => addDays(prev, -1))}
                            style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
                        >
                            <ChevronLeft size={20} color={theme.brandForest} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSelectedDate(prev => addDays(prev, 1))}
                            style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
                        >
                            <ChevronRight size={20} color={theme.brandForest} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setSelectedDate(prev => addDays(prev, 7))}
                            style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
                        >
                            <ChevronsRight size={20} color={theme.brandForest} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.calendarStrip}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
                    {weekDays.map((date, i) => {
                        const isSelected = isSameDay(date, selectedDate);
                        return (
                            <TouchableOpacity
                                key={i}
                                onPress={() => setSelectedDate(date)}
                                style={[
                                    styles.dayCard,
                                    isSelected && { backgroundColor: theme.brandForest, borderColor: theme.brandForest }
                                ]}
                            >
                                <Text style={[styles.dayText, isSelected && { color: '#FFF' }]}>{format(date, 'EEE')}</Text>
                                <Text style={[styles.dateText, isSelected && { color: '#FFF' }]}>{format(date, 'd')}</Text>
                                {isSelected && <View style={styles.activeDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.mealList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.brandForest}
                        colors={[theme.brandForest]}
                    />
                }
            >
                <View style={styles.statusBanner}>
                    <Text style={[styles.statusLabel, { color: isPublished ? theme.brandSage : '#94a3b8' }]}>
                        {isPublished ? '✓ Plan Published by Dietician' : '○ No plan for today'}
                    </Text>
                </View>

                {dayPlan?.meals?.length > 0 ? (
                    dayPlan.meals.map((mealEntry: any, index: number) => {
                        const hasFood = mealEntry.foodItems?.length > 0 && isPublished;
                        if (!hasFood) return null;

                        return (
                            <View key={index} style={[styles.slotCard, { borderColor: theme.brandSage + '10' }]}>
                                <View style={styles.slotHeader}>
                                    <Clock size={14} color={theme.brandSage} />
                                    <Text style={styles.slotTime}>{mealEntry.time}</Text>
                                    <Text style={[styles.slotName, { color: theme.brandForest }]}>
                                        {MEAL_SLOTS.find(m => m.time === mealEntry.time)?.name || `Meal ${index + 1}`}
                                    </Text>
                                </View>

                                <View style={styles.slotContent}>
                                    {mealEntry.foodItems.map((item: any, idx: number) => {
                                        const isRecipe = !!item.recipeId;

                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={styles.foodItem}
                                                disabled={!isRecipe}
                                                activeOpacity={0.7}
                                                onPress={() => isRecipe && router.push(`/recipe/${item.recipeId}`)}
                                            >
                                                <View style={[styles.foodDot, { backgroundColor: isRecipe ? theme.tint : theme.brandSage }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.foodName, { color: isRecipe ? theme.tint : theme.text }]}>{item.name}</Text>
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                        <Text style={styles.foodPortion}>
                                                            {item.quantity ? (
                                                                <Text style={{ fontWeight: '700', color: theme.brandForest }}>{item.quantity}</Text>
                                                            ) : (
                                                                item.portion
                                                            )}
                                                            {item.quantity && item.portion && item.portion.toLowerCase() !== '1 serving' && (
                                                                <Text style={{ fontWeight: '400' }}> ({item.portion})</Text>
                                                            )}
                                                        </Text>
                                                        {isRecipe && (
                                                            <View style={{ backgroundColor: theme.tint + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                                                <Text style={{ fontSize: 9, fontWeight: '800', color: theme.tint, textTransform: 'uppercase' }}>Recipe</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                                {isRecipe && <ChevronRight size={14} color={theme.tint} style={{ opacity: 0.5 }} />}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={[styles.slotCard, { borderColor: theme.brandSage + '10', alignItems: 'center', padding: 32, gap: 16 }]}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: theme.brandSage + '15', alignItems: 'center', justifyContent: 'center' }}>
                            <CalendarIcon size={32} color={theme.brandForest} />
                        </View>
                        <View style={{ alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.brandForest }}>No Plan Assigned</Text>
                            <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 }}>
                                Connect with your dietician to get your personalized nutrition plan.
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={{
                                marginTop: 8,
                                backgroundColor: theme.brandForest,
                                paddingHorizontal: 24,
                                paddingVertical: 12,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8
                            }}
                            onPress={() => setIsBookAppointmentOpen(true)}
                        >
                            <Text style={{ color: '#FFF', fontWeight: '700' }}>Book Appointment</Text>
                            <ChevronRight size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <BookAppointmentModal
                isOpen={isBookAppointmentOpen}
                onClose={() => setIsBookAppointmentOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    header: { marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
    calendarStrip: { marginHorizontal: -24, marginBottom: 32 },
    stripContent: { paddingHorizontal: 24, gap: 12 },
    dayCard: {
        width: 60,
        height: 80,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF',
    },
    dayText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
    dateText: { fontSize: 20, fontWeight: '900', marginTop: 4 },
    activeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFF', marginTop: 4 },
    mealList: { paddingBottom: 40 },
    statusBanner: { marginBottom: 20, paddingHorizontal: 4 },
    statusLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    slotCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
        shadowOpacity: 0.03,
        elevation: 2,
    },
    slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    slotTime: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
    slotName: { fontSize: 14, fontWeight: '900', marginLeft: 'auto' },
    slotContent: { paddingLeft: 22 },
    foodItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    foodDot: { width: 4, height: 4, borderRadius: 2 },
    foodName: { fontSize: 14, fontWeight: '700' },
    foodPortion: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
    emptyText: { fontSize: 13, fontStyle: 'italic', color: '#cbd5e1' },
    navButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

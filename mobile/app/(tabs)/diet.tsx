import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, Clock } from 'lucide-react-native';

const MEAL_SLOTS = [
    { time: '07:00 AM', name: 'Early Morning' },
    { time: '09:00 AM', name: 'Breakfast' },
    { time: '11:30 AM', name: 'Mid-Morning' },
    { time: '01:30 PM', name: 'Lunch' },
    { time: '04:30 PM', name: 'Evening' },
    { time: '08:30 PM', name: 'Dinner' },
];

export default function DietPlanScreen() {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekPlan, setWeekPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];

    const weekStart = React.useMemo(() => startOfWeek(selectedDate, { weekStartsOn: 1 }), [selectedDate]);
    const weekDays = React.useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

    useEffect(() => {
        if (user) {
            if (user.dietStartDate) {
                const startDate = new Date(user.dietStartDate);
                if (!isNaN(startDate.getTime())) {
                    setSelectedDate(startDate);
                }
            }
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

    const dayPlan = weekPlan?.days?.find((d: any) => isSameDay(new Date(d.date), selectedDate));
    const isPublished = dayPlan?.status === 'PUBLISHED';

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.brandForest }]}>Daily Nutrition</Text>
                <Text style={styles.subtitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
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

            <ScrollView contentContainerStyle={styles.mealList} showsVerticalScrollIndicator={false}>
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
                                    {mealEntry.foodItems.map((item: any, idx: number) => (
                                        <View key={idx} style={styles.foodItem}>
                                            <View style={[styles.foodDot, { backgroundColor: theme.brandSage }]} />
                                            <Text style={[styles.foodName, { color: theme.text }]}>{item.name}</Text>
                                            <Text style={styles.foodPortion}>
                                                {item.quantity ? (
                                                    // specific quantity available (e.g. "1 bowl", "100g")
                                                    <Text style={{ fontWeight: '700', color: theme.brandForest }}>{item.quantity}</Text>
                                                ) : (
                                                    // fallback to portion if no specific quantity
                                                    item.portion
                                                )}
                                                {/* Show portion in brackets if it exists, adds context, and isn't just "1 serving" redundancy */}
                                                {item.quantity && item.portion && item.portion.toLowerCase() !== '1 serving' && (
                                                    <Text style={{ fontWeight: '400' }}> ({item.portion})</Text>
                                                )}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={[styles.slotCard, { borderColor: theme.brandSage + '10', alignItems: 'center', padding: 32 }]}>
                        <Text style={[styles.emptyText, { fontSize: 14 }]}>No meals scheduled for this day.</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 64 },
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
});

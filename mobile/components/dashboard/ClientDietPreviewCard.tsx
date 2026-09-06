import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { Calendar as CalendarIcon, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Clock, Eye, MessageCircle, CheckCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { parseToLocalDate } from '@/lib/date-utils';

const MEAL_NAMES_BY_NUMBER: Record<number, string> = {
  1: 'Early Morning',
  2: 'Breakfast',
  3: 'Mid-Morning',
  4: 'Lunch',
  5: 'Evening',
  6: 'Dinner',
  7: 'Bedtime',
};

const formatTimeTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  if (/am|pm/i.test(timeStr)) return timeStr;
  const [hourStr, minute] = timeStr.split(':');
  let hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return timeStr;
  const period = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 === 0 ? 12 : hour;
  return `${hour.toString().padStart(2, '0')}:${minute || '00'} ${period}`;
};

export interface ClientDietPreviewCardRef {
  refresh: () => void;
}

interface ClientDietPreviewCardProps {
  clientId: string;
  clientDietStartDate?: string;
  initialWeekStartDate?: Date;
}

const ClientDietPreviewCard = forwardRef<ClientDietPreviewCardRef, ClientDietPreviewCardProps>(
  ({ clientId, clientDietStartDate, initialWeekStartDate }, ref) => {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];

    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [weekPlan, setWeekPlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getLocalDateFromStr = (dateStr: any) => {
      return parseToLocalDate(dateStr);
    };

    const weekStart = React.useMemo(() => {
      if (initialWeekStartDate) {
        const diff = (selectedDate.getDay() - initialWeekStartDate.getDay() + 7) % 7;
        return addDays(selectedDate, -diff);
      }
      if (clientDietStartDate) {
        const dietStart = getLocalDateFromStr(clientDietStartDate);
        const startDayIndex = dietStart.getDay();
        const currentDayIndex = selectedDate.getDay();
        const diff = (currentDayIndex - startDayIndex + 7) % 7;
        return addDays(selectedDate, -diff);
      }
      return startOfWeek(selectedDate, { weekStartsOn: 1 });
    }, [selectedDate, clientDietStartDate, initialWeekStartDate]);

    const weekDays = React.useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);

    const fetchClientDietPlan = async () => {
      if (!clientId) return;
      setLoading(true);
      try {
        const startDateStr = format(weekStart, 'yyyy-MM-dd');
        // Query with previewMode=client to mimic client status filtering exactly
        const data = await api.get<any>(`/api/clients/${clientId}/diet-plan?startDate=${startDateStr}&previewMode=client`);

        if (data && data.days) {
          setWeekPlan(data);
        } else {
          setWeekPlan({
            weekStartDate: weekStart,
            days: Array.from({ length: 7 }).map((_, i) => ({
              date: format(addDays(weekStart, i), 'yyyy-MM-dd'),
              meals: [],
              status: 'NO_DIET',
            })),
          });
        }
      } catch (error) {
        console.error('Failed to fetch client preview diet plan:', error);
        setWeekPlan({
          weekStartDate: weekStart,
          days: Array.from({ length: 7 }).map((_, i) => ({
            date: format(addDays(weekStart, i), 'yyyy-MM-dd'),
            meals: [],
            status: 'NO_DIET',
          })),
        });
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refresh: () => {
        fetchClientDietPlan();
      },
    }));

    useEffect(() => {
      fetchClientDietPlan();
    }, [clientId, weekStart]);

    const handleRefresh = async () => {
      setRefreshing(true);
      await fetchClientDietPlan();
      setRefreshing(false);
    };

    const dayPlan = weekPlan?.days?.find((d: any) => {
      const rawDate = d?.date || d?._doc?.date;
      return rawDate ? isSameDay(getLocalDateFromStr(rawDate), selectedDate) : false;
    });
    const isPublished = dayPlan?.status === 'PUBLISHED';
    const hasAnyPublishedMeals = isPublished && dayPlan?.meals?.some((meal: any) => meal.foodItems?.length > 0);

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Customer Preview Notice Header */}
        <View style={styles.previewNoticeBanner}>
          <Eye size={16} color="#0369a1" />
          <Text style={styles.previewNoticeText}>
            🔒 Read-Only Customer View: Displays exact live client view & publication filter. To make edits, switch back to Editor Mode.
          </Text>
        </View>

        {/* Date Navigation Bar */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.title, { color: theme.brandForest }]}>Customer View</Text>
              <Text style={styles.subtitle}>{format(selectedDate, 'MMMM yyyy')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TouchableOpacity
                onPress={() => setSelectedDate(prev => addDays(prev, -7))}
                style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
              >
                <ChevronsLeft size={18} color={theme.brandForest} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedDate(prev => addDays(prev, -1))}
                style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
              >
                <ChevronLeft size={18} color={theme.brandForest} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedDate(prev => addDays(prev, 1))}
                style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
              >
                <ChevronRight size={18} color={theme.brandForest} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSelectedDate(prev => addDays(prev, 7))}
                style={[styles.navButton, { backgroundColor: theme.brandSage + '15' }]}
              >
                <ChevronsRight size={18} color={theme.brandForest} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Horizontal Calendar Strip */}
        <View style={styles.calendarStrip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
            {weekDays.map((date, i) => {
              const isSelected = isSameDay(date, selectedDate);
              const targetDayPlan = weekPlan?.days?.find((d: any) => isSameDay(getLocalDateFromStr(d.date), date));
              const dayIsPublished = targetDayPlan?.status === 'PUBLISHED' && targetDayPlan?.meals?.some((m: any) => m.foodItems?.length > 0);

              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => setSelectedDate(date)}
                  style={[
                    styles.dayCard,
                    isSelected && { backgroundColor: theme.brandForest, borderColor: theme.brandForest },
                  ]}
                >
                  <Text style={[styles.dayText, isSelected && { color: '#FFF' }]}>{format(date, 'EEE')}</Text>
                  <Text style={[styles.dateText, isSelected && { color: '#FFF' }]}>{format(date, 'd')}</Text>
                  {dayIsPublished && (
                    <View style={[styles.activeDot, isSelected && { backgroundColor: '#FFF' }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Meal Content & Status Feed */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={theme.brandForest} />
            <Text style={styles.loadingText}>Fetching live customer view...</Text>
          </View>
        ) : (
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
              <Text style={[styles.statusLabel, { color: isPublished ? theme.brandSage : '#ef4444' }]}>
                {isPublished ? '✓ Plan Published & Visible to Client' : '✕ No Published Plan Visible for Today'}
              </Text>
            </View>

            {/* Read Receipt & WhatsApp Share Banner */}
            {isPublished && (
              <View style={styles.readReceiptCard}>
                <View style={styles.readReceiptRow}>
                  <CheckCheck size={16} color={weekPlan?.lastViewedByClientAt ? '#10b981' : '#f59e0b'} />
                  <Text style={styles.readReceiptText}>
                    {weekPlan?.lastViewedByClientAt
                      ? `Client Viewed: ${format(new Date(weekPlan.lastViewedByClientAt), 'MMM d, h:mm a')}`
                      : 'Published — Awaiting Client to Open App'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.whatsAppShareBtn}
                  onPress={() => {
                    const message = `Hi! 👋 Your personalized diet plan for this week is now live in your DateWithDiet App. Open the app to view your daily meals!`;
                    Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`);
                  }}
                >
                  <MessageCircle size={14} color="#fff" />
                  <Text style={styles.whatsAppShareText}>Share via WhatsApp</Text>
                </TouchableOpacity>
              </View>
            )}

            {hasAnyPublishedMeals ? (
              dayPlan.meals.map((mealEntry: any, index: number) => {
                const hasFood = mealEntry.foodItems?.length > 0;
                if (!hasFood) return null;

                return (
                  <View key={index} style={[styles.slotCard, { borderColor: theme.brandSage + '10' }]}>
                    <View style={styles.slotHeader}>
                      <Clock size={14} color={theme.brandSage} />
                      <Text style={styles.slotTime}>{formatTimeTo12Hour(mealEntry.time)}</Text>
                      <Text style={[styles.slotName, { color: theme.brandForest }]}>
                        {MEAL_NAMES_BY_NUMBER[mealEntry.mealNumber] || `Meal ${mealEntry.mealNumber}`}
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
                            onPress={() => isRecipe && router.push(`/recipe/${item.recipeId}` as any)}
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
              <View style={[styles.slotCard, { borderColor: '#e2e8f0', alignItems: 'center', padding: 28, gap: 12 }]}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <CalendarIcon size={28} color="#94a3b8" />
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#334155' }}>No Published Plan Visible</Text>
                  <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', lineHeight: 18 }}>
                    Client currently sees "No Plan Assigned" for this date. Click "Publish Weekly Plan" to make it visible.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    );
  }
);

ClientDietPreviewCard.displayName = 'ClientDietPreviewCard';

export default ClientDietPreviewCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  previewNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  previewNoticeText: {
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '700',
    flex: 1,
  },
  header: { marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  calendarStrip: { marginHorizontal: -16, marginBottom: 20 },
  stripContent: { paddingHorizontal: 16, gap: 10 },
  dayCard: {
    width: 52,
    height: 70,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  dayText: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase' },
  dateText: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  activeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10b981', marginTop: 4 },
  loadingContainer: { padding: 40, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  mealList: { paddingBottom: 32 },
  statusBanner: { marginBottom: 16, paddingHorizontal: 4 },
  statusLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  slotCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOpacity: 0.03,
    elevation: 2,
  },
  slotHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  slotTime: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  slotName: { fontSize: 13, fontWeight: '900', marginLeft: 'auto' },
  slotContent: { paddingLeft: 18 },
  foodItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  foodDot: { width: 4, height: 4, borderRadius: 2 },
  foodName: { fontSize: 13, fontWeight: '700' },
  foodPortion: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readReceiptCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  readReceiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  readReceiptText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    flex: 1,
  },
  whatsAppShareBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  whatsAppShareText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
});

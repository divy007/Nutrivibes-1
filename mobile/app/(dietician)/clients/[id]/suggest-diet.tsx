import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { startOfWeek, addDays, format, subWeeks, addWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle, Plus, Trash2, Copy, Clipboard, Check, X, Clock, Search } from 'lucide-react-native';
import { foodItems } from '@/data/foodItems';
import { parseToLocalDate } from '@/lib/date-utils';

// Default meal labels
const MEAL_LABELS: Record<number, string> = {
  1: 'Early Morning',
  2: 'Breakfast',
  3: 'Mid-Morning',
  4: 'Lunch',
  5: 'Evening Snack',
  6: 'Dinner',
  7: 'Bedtime',
};

const DEFAULT_MEAL_TIMINGS = [
  { mealNumber: 1, time: '06:30' },
  { mealNumber: 2, time: '09:30' },
  { mealNumber: 3, time: '11:00' },
  { mealNumber: 4, time: '14:00' },
  { mealNumber: 5, time: '17:00' },
  { mealNumber: 6, time: '20:00' },
  { mealNumber: 7, time: '22:00' },
];

interface FoodItem {
  id: string;
  name: string;
  category: string;
  portion: string;
  quantity?: string;
  recipeId?: string;
  isRecipe?: boolean;
}

interface MealSlot {
  time: string;
  mealNumber: number;
  foodItems: FoodItem[];
}

interface DayPlan {
  date: string;
  status: 'NO_DIET' | 'NOT_SAVED' | 'PUBLISHED';
  meals: MealSlot[];
}

interface ClientInfo {
  _id: string;
  name: string;
  age?: number;
  gender?: string;
  weight?: number;
  height?: number;
  dietStartDate?: string;
  dietaryPreferences?: string[];
  primaryGoal?: string[];
  mealTimings?: { mealNumber: number; time: string }[];
  counsellingProfile?: {
    medicalConditions?: string[];
    allergies?: string[];
    deficiencies?: string[];
    stapleFood?: string;
  };
}

export default function SuggestDietScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Planner States
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => {
    return startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
  });
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0); // 0 (Mon) to 6 (Sun)
  const [daysPlan, setDaysPlan] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState(true);

  // Copy/Paste buffers
  const [copiedDayMeals, setCopiedDayMeals] = useState<MealSlot[] | null>(null);

  // Modal States - Add Food
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [activeMealNum, setActiveMealNum] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qty, setQty] = useState('1 serving');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [repeatStrategy, setRepeatStrategy] = useState<'date' | 'weekly' | 'custom'>('date');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const toggleCustomDay = (idx: number) => {
    setSelectedDays(prev => {
      if (prev.includes(idx)) {
        return prev.filter(d => d !== idx);
      } else {
        return [...prev, idx].sort();
      }
    });
  };

  // Modal States - Timing
  const [isTimingOpen, setIsTimingOpen] = useState(false);
  const [timingMealNum, setTimingMealNum] = useState<number | null>(null);
  const [timingVal, setTimingVal] = useState('');

  // Fetch client & plan
  const fetchPlannerData = async (targetDate?: Date) => {
    if (!id) return;
    setLoading(true);
    try {
      const clientData = await api.get<any>(`/api/clients/${id}`);
      setClient(clientData);

      // Fetch weekly recipes for suggestions
      const recipeData = await api.get<any>('/api/dietician/recipes?limit=1000');
      setRecipes(recipeData.recipes || []);

      // Determine starting date of the week anchored to client's dietStartDate
      let computedStartDate = targetDate;
      if (!computedStartDate) {
        if (clientData.dietStartDate) {
          const dietStart = parseToLocalDate(clientData.dietStartDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let startOfCurrentWeek = dietStart;
          if (dietStart <= today) {
            const startDayIndex = dietStart.getDay();
            const currentDayIndex = today.getDay();
            const diff = (currentDayIndex - startDayIndex + 7) % 7;
            startOfCurrentWeek = addDays(today, -diff);
          }
          computedStartDate = startOfCurrentWeek;
        } else {
          computedStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
        }
      }

      setWeekStartDate(computedStartDate);

      // Fetch diet plan using the computed week start date
      const formattedStartDate = format(computedStartDate, 'yyyy-MM-dd');
      const planData = await api.get<any>(`/api/clients/${id}/diet-plan?startDate=${formattedStartDate}`);

      const timings = clientData.mealTimings && clientData.mealTimings.length > 0
        ? clientData.mealTimings
        : DEFAULT_MEAL_TIMINGS;

      const initialDays: DayPlan[] = Array.from({ length: 7 }).map((_, idx) => {
        const dayDate = addDays(computedStartDate!, idx);
        const dayDateStr = format(dayDate, 'yyyy-MM-dd');

        return {
          date: dayDateStr,
          status: 'NO_DIET',
          meals: timings.map((t: any) => ({
            time: t.time,
            mealNumber: t.mealNumber,
            foodItems: []
          }))
        };
      });

      if (planData && planData.days && planData.days.length > 0) {
        planData.days.forEach((fetchedDay: any) => {
          const fetchedDateStr = format(new Date(fetchedDay.date), 'yyyy-MM-dd');
          const dayIdx = initialDays.findIndex(d => d.date === fetchedDateStr);
          if (dayIdx !== -1) {
            initialDays[dayIdx].status = fetchedDay.status || 'PUBLISHED';
            if (fetchedDay.meals && fetchedDay.meals.length > 0) {
              fetchedDay.meals.forEach((fetchedMeal: any) => {
                const meal = initialDays[dayIdx].meals.find(m => m.mealNumber === fetchedMeal.mealNumber);
                if (meal) {
                  meal.time = fetchedMeal.time;
                  meal.foodItems = fetchedMeal.foodItems || [];
                }
              });
            }
          }
        });
      }

      setDaysPlan(initialDays);
    } catch (error) {
      console.error('Failed to load planner data:', error);
      Alert.alert('Error', 'Could not load weekly diet planner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlannerData();
  }, [id]);

  const currentDay = daysPlan[selectedDayIdx];
  const isPublished = currentDay?.status === 'PUBLISHED';
  const hasPublishedDays = daysPlan.some(day => day.status === 'PUBLISHED');

  // Search filter for Add Food Modal
  const suggestions = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();

    const recipeResults = recipes.filter(r => r.name.toLowerCase().includes(query)).map(r => ({
      id: r._id,
      name: r.name,
      category: 'recipe',
      portion: '1 serving',
      recipeId: r._id,
      isRecipe: true,
    }));

    const foodResults = foodItems.filter(f => f.name.toLowerCase().includes(query) && !recipeResults.some(r => r.name.toLowerCase() === f.name.toLowerCase())).map(f => ({
      id: f.id,
      name: f.name,
      category: f.category,
      portion: f.portion || '1 serving',
      isRecipe: false,
    }));

    return [...recipeResults, ...foodResults].slice(0, 10);
  }, [searchQuery, recipes]);

  // Navigate Weeks
  const handlePrevWeek = () => {
    const newDate = subWeeks(weekStartDate, 1);
    fetchPlannerData(newDate);
  };

  const handleNextWeek = () => {
    const newDate = addWeeks(weekStartDate, 1);
    fetchPlannerData(newDate);
  };

  // Add Food Item to Meal Slot
  const handleAddFoodSubmit = () => {
    if (!selectedFood && !searchQuery) return;

    let itemToAdd: FoodItem;

    // Check if the typed query or selected food matches any recipe by name
    const nameToCheck = selectedFood ? selectedFood.name : searchQuery;
    const matchingRecipe = recipes.find(
      r => r.name.toLowerCase().trim() === nameToCheck.toLowerCase().trim()
    );

    if (matchingRecipe) {
      itemToAdd = {
        id: matchingRecipe._id,
        name: matchingRecipe.name,
        category: 'recipe',
        portion: '1 serving',
        quantity: qty,
        recipeId: matchingRecipe._id,
        isRecipe: true,
      };
    } else if (selectedFood) {
      itemToAdd = { ...selectedFood, quantity: qty };
    } else {
      // Custom generic entry
      itemToAdd = {
        id: `custom-${Date.now()}`,
        name: searchQuery,
        category: 'custom',
        portion: '1 serving',
        quantity: qty
      };
    }

    setDaysPlan(prev => {
      return prev.map((day, idx) => {
        // Determine whether to add to this day
        let shouldAdd = false;
        if (repeatStrategy === 'weekly') {
          shouldAdd = true;
        } else if (repeatStrategy === 'custom') {
          shouldAdd = selectedDays.includes(idx);
        } else {
          shouldAdd = idx === selectedDayIdx;
        }

        if (!shouldAdd) return day;

        return {
          ...day,
          status: day.status === 'NO_DIET' ? 'NOT_SAVED' : day.status,
          meals: day.meals.map(meal => {
            if (meal.mealNumber !== activeMealNum) return meal;
            return {
              ...meal,
              foodItems: [...meal.foodItems, itemToAdd]
            };
          })
        };
      });
    });

    // Reset states
    setIsAddFoodOpen(false);
    setSearchQuery('');
    setQty('1 serving');
    setSelectedFood(null);
    setSelectedDays([]);
  };

  // Delete Food Item from slot
  const handleDeleteFood = (mealNumber: number, foodId: string) => {
    setDaysPlan(prev => {
      return prev.map((day, idx) => {
        if (idx !== selectedDayIdx) return day;

        return {
          ...day,
          status: 'NOT_SAVED',
          meals: day.meals.map(meal => {
            if (meal.mealNumber !== mealNumber) return meal;
            return {
              ...meal,
              foodItems: meal.foodItems.filter(item => item.id !== foodId)
            };
          })
        };
      });
    });
  };

  // Timing Modal
  const openTimingModal = (mealNumber: number, currentTime: string) => {
    setTimingMealNum(mealNumber);
    setTimingVal(currentTime);
    setIsTimingOpen(true);
  };

  const handleSaveTiming = () => {
    if (!timingVal.trim() || !timingMealNum) return;

    setDaysPlan(prev => {
      return prev.map(day => ({
        ...day,
        status: day.status === 'NO_DIET' ? 'NOT_SAVED' : day.status,
        meals: day.meals.map(meal => {
          if (meal.mealNumber !== timingMealNum) return meal;
          return { ...meal, time: timingVal.trim() };
        })
      }));
    });

    setIsTimingOpen(false);
  };

  // Copy / Paste Day
  const handleCopyDay = () => {
    if (currentDay && currentDay.meals) {
      setCopiedDayMeals(JSON.parse(JSON.stringify(currentDay.meals)));
      Alert.alert('Copied', 'Meals copied from current day.');
    }
  };

  const handlePasteDay = () => {
    if (!copiedDayMeals) {
      Alert.alert('Empty Buffer', 'No day meals copied yet.');
      return;
    }

    setDaysPlan(prev => {
      return prev.map((day, idx) => {
        if (idx !== selectedDayIdx) return day;

        return {
          ...day,
          status: 'NOT_SAVED',
          meals: day.meals.map(m => {
            const copied = copiedDayMeals.find(cm => cm.mealNumber === m.mealNumber);
            return {
              ...m,
              foodItems: copied ? copied.foodItems : []
            };
          })
        };
      });
    });
  };

  // Clear Day/Week
  const handleClearDay = () => {
    setDaysPlan(prev => {
      return prev.map((day, idx) => {
        if (idx !== selectedDayIdx) return day;
        return {
          ...day,
          status: 'NOT_SAVED',
          meals: day.meals.map(m => ({ ...m, foodItems: [] }))
        };
      });
    });
  };

  const handleClearWeek = () => {
    const hasPublishedDays = daysPlan.some(day => day.status === 'PUBLISHED');
    if (hasPublishedDays) {
      Alert.alert('Action Blocked', 'Cannot clear weekly plan: One or more days are published. Please unpublish those days first.');
      return;
    }
    Alert.alert(
      'Clear Week',
      'Are you sure you want to clear all diet plans for this entire week?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setDaysPlan(prev => {
              return prev.map(day => ({
                ...day,
                status: 'NOT_SAVED',
                meals: day.meals.map(m => ({ ...m, foodItems: [] }))
              }));
            });
          }
        }
      ]
    );
  };

  // Unpublish current day plan
  const handleUnpublishDay = async () => {
    if (!currentDay) return;
    
    const hasFood = currentDay.meals.some(m => m.foodItems.length > 0);
    const newStatus = hasFood ? 'NOT_SAVED' : 'NO_DIET';

    setLoading(true);
    try {
      const formattedStartDate = format(weekStartDate, 'yyyy-MM-dd');
      
      const requestDays = daysPlan.map((day, idx) => {
        if (idx === selectedDayIdx) {
          return {
            date: day.date,
            status: newStatus,
            meals: day.meals
          };
        }
        return {
          date: day.date,
          status: day.status,
          meals: day.meals
        };
      });

      await api.post(`/api/clients/${id}/diet-plan`, {
        weekStartDate: formattedStartDate,
        days: requestDays
      });

      setDaysPlan(prev => {
        return prev.map((day, idx) => {
          if (idx !== selectedDayIdx) return day;
          return { ...day, status: newStatus };
        });
      });

      Alert.alert('Success', 'Day plan unpublished.');
    } catch (error) {
      console.error('Failed to unpublish day:', error);
      Alert.alert('Error', 'Could not unpublish day plan.');
    } finally {
      setLoading(false);
    }
  };

  // Save and Publish Diet
  const handlePublishPlan = async () => {
    setLoading(true);
    try {
      const formattedStartDate = format(weekStartDate, 'yyyy-MM-dd');
      
      // Serialize plan to published status for saved days
      const requestDays = daysPlan.map(day => ({
        date: day.date,
        status: day.meals.some(m => m.foodItems.length > 0) ? 'PUBLISHED' : 'NO_DIET',
        meals: day.meals
      }));

      await api.post(`/api/clients/${id}/diet-plan`, {
        weekStartDate: formattedStartDate,
        days: requestDays
      });

      Alert.alert('Success', 'Weekly diet plan saved and published.');
      fetchPlannerData();
    } catch (error) {
      console.error('Failed to publish plan:', error);
      Alert.alert('Error', 'Could not save diet plan.');
      setLoading(false);
    }
  };

  if (loading && daysPlan.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.brandForest} />
      </View>
    );
  }

  const clientConditions = client?.counsellingProfile?.medicalConditions || [];
  const clientAllergies = client?.counsellingProfile?.allergies || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Collapsible Client Info Summary */}
      {client && (
        <View style={[styles.clientInfoCard, { borderColor: theme.brandForest + '15' }]}>
          <TouchableOpacity 
            style={styles.infoCardHeader} 
            onPress={() => setIsInfoExpanded(!isInfoExpanded)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={[styles.infoAvatar, { backgroundColor: theme.brandForest + '10' }]}>
                <Text style={[styles.infoAvatarText, { color: theme.brandForest }]}>
                  {client.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoClientName} numberOfLines={1}>{client.name}</Text>
                <Text style={styles.infoClientSub}>
                  {client.gender || 'N/A'} • {client.age ? `${client.age} yrs` : 'N/A'} • {client.weight ? `${client.weight} kg` : 'N/A'}
                </Text>
              </View>
            </View>
            <ChevronRight 
              size={18} 
              color={theme.brandForest} 
              style={{ transform: [{ rotate: isInfoExpanded ? '90deg' : '0deg' }] }} 
            />
          </TouchableOpacity>

          {isInfoExpanded && (
            <View style={styles.infoCardBody}>
              <View style={styles.divider} />
              
              <View style={styles.infoGrid}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.infoGridLabel}>Goal</Text>
                  <Text style={styles.infoGridValue} numberOfLines={2}>
                    {client.primaryGoal?.join(', ') || 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoGridItem}>
                  <Text style={styles.infoGridLabel}>Preferences</Text>
                  <Text style={styles.infoGridValue} numberOfLines={2}>
                    {client.dietaryPreferences?.join(', ') || 'N/A'}
                  </Text>
                </View>

                <View style={styles.infoGridItem}>
                  <Text style={styles.infoGridLabel}>BMI / Height</Text>
                  <Text style={styles.infoGridValue}>
                    {client.height ? `${client.height} cm` : 'N/A'}
                    {client.weight && client.height ? ` (BMI: ${(client.weight / ((client.height / 100) * (client.height / 100))).toFixed(1)})` : ''}
                  </Text>
                </View>

                <View style={styles.infoGridItem}>
                  <Text style={styles.infoGridLabel}>Deficiencies</Text>
                  <Text style={styles.infoGridValue} numberOfLines={2}>
                    {client.counsellingProfile?.deficiencies?.join(', ') || 'None'}
                  </Text>
                </View>
              </View>

              {client.counsellingProfile?.stapleFood && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.infoGridLabel}>Staple Food</Text>
                  <Text style={styles.infoGridValue}>{client.counsellingProfile.stapleFood}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Week Selector */}
      <View style={styles.weekSelector}>
        <TouchableOpacity style={styles.weekArrow} onPress={handlePrevWeek}>
          <ChevronLeft size={20} color={theme.brandForest} />
        </TouchableOpacity>
        <Text style={styles.weekLabel}>
          Week of {format(weekStartDate, 'dd MMM yyyy')}
        </Text>
        <TouchableOpacity style={styles.weekArrow} onPress={handleNextWeek}>
          <ChevronRight size={20} color={theme.brandForest} />
        </TouchableOpacity>
      </View>

      {/* Day Selector */}
      <View style={styles.daySelector}>
        {Array.from({ length: 7 }).map((_, idx) => {
          const dayDate = addDays(weekStartDate, idx);
          const dayName = format(dayDate, 'EEE');
          const isSelected = selectedDayIdx === idx;
          const hasFoods = daysPlan[idx]?.meals?.some(m => m.foodItems.length > 0);

          return (
            <TouchableOpacity
              key={`day-tab-${idx}`}
              style={[
                styles.dayTab,
                isSelected && [styles.selectedDayTab, { backgroundColor: theme.brandForest }]
              ]}
              onPress={() => setSelectedDayIdx(idx)}
            >
              <Text style={[styles.dayText, isSelected && { color: '#fff', fontWeight: '900' }]}>
                {dayName}
              </Text>
              <Text style={[styles.daySubText, isSelected && { color: 'rgba(255,255,255,0.7)' }]}>
                {format(dayDate, 'd')}
              </Text>
              {hasFoods && (
                <View style={[styles.indicatorDot, { backgroundColor: isSelected ? '#fff' : theme.brandForest }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Action Bar */}
      <View style={styles.actionBarContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.actionBarScroll}
        >
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopyDay}>
            <Copy size={14} color="#64748b" />
            <Text style={styles.actionBtnLabel}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => {
              if (isPublished) {
                Alert.alert('Action Blocked', 'Cannot paste into a published day. Please unpublish first.');
                return;
              }
              handlePasteDay();
            }} 
            disabled={!copiedDayMeals || isPublished}
          >
            <Clipboard size={14} color={copiedDayMeals && !isPublished ? '#64748b' : '#cbd5e1'} />
            <Text style={[styles.actionBtnLabel, (!copiedDayMeals || isPublished) && { color: '#cbd5e1' }]}>Paste</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => {
              if (isPublished) {
                Alert.alert('Action Blocked', 'Cannot clear a published day. Please unpublish first.');
                return;
              }
              handleClearDay();
            }}
            disabled={isPublished}
          >
            <Trash2 size={14} color={isPublished ? '#cbd5e1' : '#ef4444'} />
            <Text style={[styles.actionBtnLabel, { color: isPublished ? '#cbd5e1' : '#ef4444' }]}>Clear Day</Text>
          </TouchableOpacity>
          
          {currentDay?.status === 'PUBLISHED' ? (
            <TouchableOpacity style={[styles.actionBtn, { borderColor: '#fed7aa', backgroundColor: '#fff7ed' }]} onPress={handleUnpublishDay}>
              <X size={14} color="#b45309" />
              <Text style={[styles.actionBtnLabel, { color: '#b45309' }]}>Unpublish</Text>
            </TouchableOpacity>
          ) : (
            currentDay?.meals?.some(m => m.foodItems.length > 0) && (
              <View style={[styles.actionBtn, { opacity: 0.8, backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
                <Text style={[styles.actionBtnLabel, { fontStyle: 'italic', color: '#64748b' }]}>Draft</Text>
              </View>
            )
          )}

          <TouchableOpacity 
            style={[
              styles.actionBtn, 
              { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
              hasPublishedDays && { borderColor: '#e2e8f0', backgroundColor: '#f1f5f9', opacity: 0.5 }
            ]} 
            onPress={handleClearWeek}
            disabled={hasPublishedDays}
          >
            <Trash2 size={14} color={hasPublishedDays ? '#94a3b8' : '#ef4444'} />
            <Text style={[styles.actionBtnLabel, { color: hasPublishedDays ? '#94a3b8' : '#ef4444' }]}>Clear Week</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Scrollable Meal Slots */}
      <ScrollView contentContainerStyle={styles.mealListScroll} showsVerticalScrollIndicator={false}>
        {currentDay?.meals?.map((meal) => (
          <View key={meal.mealNumber} style={[styles.mealCard, { borderColor: theme.brandForest + '10' }, isPublished && { opacity: 0.65 }]}>
            {/* Meal Card Header */}
            <View style={styles.mealHeader}>
              <View>
                <Text style={styles.mealNumberLabel}>Meal {meal.mealNumber}</Text>
                <Text style={styles.mealLabel}>{MEAL_LABELS[meal.mealNumber]}</Text>
              </View>
              <TouchableOpacity 
                style={styles.timeBadge}
                onPress={() => {
                  if (isPublished) {
                    Alert.alert('Action Blocked', 'Cannot edit timings of a published day. Please unpublish first.');
                    return;
                  }
                  openTimingModal(meal.mealNumber, meal.time);
                }}
              >
                <Clock size={12} color="#64748b" />
                <Text style={styles.timeText}>{meal.time}</Text>
              </TouchableOpacity>
            </View>

            {/* Food items inside slot */}
            <View style={styles.foodList}>
              {meal.foodItems.length > 0 ? (
                meal.foodItems.map((food: FoodItem, idx: number) => (
                  <View key={food.id + '-' + idx} style={styles.foodItemRow}>
                    <View style={styles.foodDot} />
                    <TouchableOpacity 
                      style={{ flex: 1 }} 
                      disabled={!food.recipeId} 
                      onPress={() => food.recipeId && router.push(`/recipe/${food.recipeId}` as any)}
                    >
                      <Text style={[
                        styles.foodName, 
                        food.recipeId && { textDecorationLine: 'underline', textDecorationStyle: 'dotted' }
                      ]}>
                        {food.name}
                      </Text>
                      {food.quantity && (
                        <Text style={styles.foodQty}>{food.quantity}</Text>
                      )}
                    </TouchableOpacity>
                    {!isPublished && (
                      <TouchableOpacity onPress={() => handleDeleteFood(meal.mealNumber, food.id)}>
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptySlotText}>No foods assigned yet</Text>
              )}
            </View>

            {/* Add Food Button */}
            {!isPublished && (
              <TouchableOpacity
                style={[styles.addFoodBtn, { borderColor: theme.brandForest + '25' }]}
                onPress={() => {
                  setActiveMealNum(meal.mealNumber);
                  setIsAddFoodOpen(true);
                }}
              >
                <Plus size={14} color={theme.brandForest} />
                <Text style={[styles.addFoodText, { color: theme.brandForest }]}>Add Food Item</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Save / Publish Banner */}
      <View style={styles.publishBanner}>
        <TouchableOpacity 
          style={[styles.publishBtn, { backgroundColor: theme.brandForest }]} 
          onPress={handlePublishPlan}
        >
          <Text style={styles.publishBtnText}>Publish Weekly Plan</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: ADD FOOD */}
      <Modal visible={isAddFoodOpen} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Food to Meal {activeMealNum}</Text>
              <TouchableOpacity onPress={() => setIsAddFoodOpen(false)}>
                <X size={20} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search size={16} color="#94a3b8" />
              <TextInput
                placeholder="Search food item or recipe..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.modalSearchInput}
              />
              {selectedFood && (
                <TouchableOpacity onPress={() => setSelectedFood(null)}>
                  <Check size={16} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>

            {/* Suggestions list */}
            {searchQuery.length > 0 && !selectedFood && (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                style={styles.suggestionsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionRow}
                    onPress={() => {
                      setSelectedFood(item);
                      setSearchQuery(item.name);
                    }}
                  >
                    <Text style={styles.suggestionText}>{item.name}</Text>
                    {item.isRecipe && (
                      <View style={styles.recipeTag}>
                        <Text style={styles.recipeTagText}>Recipe</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Quantity Input */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Quantity / Portion</Text>
              <TextInput
                value={qty}
                onChangeText={setQty}
                style={styles.qtyInput}
                placeholder="e.g. 1 serving, 2 pieces"
              />
            </View>

            {/* Repeat Strategy */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Frequency</Text>
              <View style={styles.repeatRow}>
                <TouchableOpacity
                  style={[styles.repeatOption, repeatStrategy === 'date' && styles.activeRepeatOption]}
                  onPress={() => setRepeatStrategy('date')}
                >
                  <Text style={[styles.repeatOptionText, repeatStrategy === 'date' && styles.activeRepeatOptionText]}>
                    Today Only
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.repeatOption, repeatStrategy === 'weekly' && styles.activeRepeatOption]}
                  onPress={() => setRepeatStrategy('weekly')}
                >
                  <Text style={[styles.repeatOptionText, repeatStrategy === 'weekly' && styles.activeRepeatOptionText]}>
                    All Week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.repeatOption, repeatStrategy === 'custom' && styles.activeRepeatOption]}
                  onPress={() => setRepeatStrategy('custom')}
                >
                  <Text style={[styles.repeatOptionText, repeatStrategy === 'custom' && styles.activeRepeatOptionText]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Day Toggles */}
            {repeatStrategy === 'custom' && (
              <View style={styles.customDaysContainer}>
                <Text style={styles.customDaysLabel}>Select Days to Apply</Text>
                <View style={styles.daysRow}>
                  {Array.from({ length: 7 }).map((_, idx) => {
                    const dayDate = addDays(weekStartDate, idx);
                    const dayName = format(dayDate, 'EEE');
                    const isSelected = selectedDays.includes(idx);
                    
                    return (
                      <TouchableOpacity
                        key={`custom-day-${idx}`}
                        style={[
                          styles.customDayBtn,
                          isSelected && { backgroundColor: theme.brandForest, borderColor: theme.brandForest }
                        ]}
                        onPress={() => toggleCustomDay(idx)}
                      >
                        <Text style={[styles.customDayText, isSelected && { color: '#fff', fontWeight: '800' }]}>
                          {dayName.slice(0, 2)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.brandForest }]} onPress={handleAddFoodSubmit}>
              <Text style={styles.modalSubmitText}>Add to Meal Slot</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: EDIT TIME */}
      <Modal visible={isTimingOpen} animationType="fade" transparent>
        <View style={styles.smallModalOverlay}>
          <View style={styles.smallModalContent}>
            <Text style={styles.modalTitle}>Edit Timing (Meal {timingMealNum})</Text>
            <TextInput
              value={timingVal}
              onChangeText={setTimingVal}
              placeholder="e.g. 08:30"
              style={styles.timeInput}
            />
            <View style={styles.smallModalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsTimingOpen(false)}>
                <Text style={{ fontWeight: '600', color: '#64748b' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.brandForest }]} onPress={handleSaveTiming}>
                <Text style={{ fontWeight: '600', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderColor: '#fef3c7',
  },
  alertText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  weekSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  weekArrow: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  weekLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  dayTab: {
    width: '13%',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  selectedDayTab: {
    // shadow rules
  },
  dayText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  daySubText: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '800',
    marginTop: 2,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    bottom: 4,
  },
  actionBarContainer: {
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  actionBarScroll: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  mealListScroll: {
    padding: 16,
    gap: 16,
    paddingBottom: 80,
  },
  mealCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealNumberLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 2,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  foodList: {
    gap: 8,
    marginBottom: 12,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9c6644',
    alignSelf: 'center',
  },
  foodName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  foodQty: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  emptySlotText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 38,
    gap: 4,
  },
  addFoodText: {
    fontSize: 12,
    fontWeight: '700',
  },
  publishBanner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  publishBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    marginBottom: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionsList: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  recipeTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recipeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
  },
  formGroup: {
    gap: 6,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  repeatOption: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeRepeatOption: {
    backgroundColor: '#1b4332',
    borderColor: '#1b4332',
  },
  repeatOptionText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
  },
  activeRepeatOptionText: {
    color: '#fff',
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  clientInfoCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoAvatarText: {
    fontSize: 14,
    fontWeight: '800',
  },
  infoClientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  infoClientSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  infoCardBody: {
    marginTop: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    marginTop: 8,
  },
  infoGridItem: {
    width: '50%',
    paddingRight: 8,
  },
  infoGridLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGridValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  customDaysContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  customDaysLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  customDayBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customDayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  smallModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  smallModalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
});

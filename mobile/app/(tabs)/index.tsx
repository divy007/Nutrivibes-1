import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { User as UserIcon, LogOut, Target, Sparkles, X, Phone, Trash2, Settings, Calendar, Gift, ChevronRight, ShieldAlert, Pause } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateCycleStatus } from '@/lib/cycle-utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import WeightTracker from '@/components/dashboard/WeightTracker';
import WaterTracker from '@/components/dashboard/WaterTracker';
import MealLogCard from '@/components/dashboard/MealLogCard';
import LogWeightModal from '@/components/dashboard/LogWeightModal';
import MeasurementTracker from '@/components/dashboard/MeasurementTracker';
import LogMeasurementModal from '@/components/dashboard/LogMeasurementModal';
import LogMealModal from '@/components/dashboard/LogMealModal';
import { SymptomCheckIn } from '@/components/dashboard/SymptomCheckIn';
import { CycleTrackerCard } from '@/components/dashboard/CycleTrackerCard';
import CycleSettingsModal from '@/components/dashboard/CycleSettingsModal';
import LogPeriodModal from '@/components/dashboard/LogPeriodModal';
import BookAppointmentModal from '@/components/dashboard/BookAppointmentModal';
import { getLocalDateString } from '@/lib/date-utils';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch, isRefetching } = useDashboardData(!!user);

  // Derived state from Query Data
  const profile = data?.profile;
  const weightLogs = data?.weightLogs || [];
  const waterData = data?.waterData;
  const mealLogs = data?.mealLogs || [];
  const measurementLogs = data?.measurementLogs || [];
  const cycleStatus = data?.cycleStatus;
  const lastPeriodLog = data?.lastPeriodLog;

  // Assessment is now part of dashboard data
  const assessment = data?.assessment;

  const SCORE_RANGES = [
    { min: 0, max: 30, color: '#FF4D4D' },
    { min: 31, max: 40, color: '#FFA500' },
    { min: 41, max: 60, color: '#FFD700' },
    { min: 61, max: 75, color: '#ADFF2F' },
    { min: 76, max: 89, color: '#32CD32' },
    { min: 90, max: 100, color: '#008000' }
  ];

  const [showWelcome, setShowWelcome] = useState(false);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isCycleSettingsOpen, setIsCycleSettingsOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [editMealData, setEditMealData] = useState<{ category: string, items: any[] } | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSavingSymptoms, setIsSavingSymptoms] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);

  const colorScheme = useColorScheme();
  const theme = (Colors as any)[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  // Welcome Banner Effect
  useEffect(() => {
    const checkWelcome = async () => {
      if (profile && profile.status === 'LEAD' && profile.registrationSource === 'MOBILE_APP') {
        const dismissed = await AsyncStorage.getItem('welcome_banner_dismissed');
        if (!dismissed) {
          setShowWelcome(true);
        }
      }
    };
    checkWelcome();
  }, [profile]);



  const handleSaveSymptoms = useCallback(async (symptoms: string[], energyLevel: number) => {
    setIsSavingSymptoms(true);
    try {
      const today = getLocalDateString();
      await api.post('/api/clients/me/symptom-logs', {
        symptoms,
        energyLevel,
        date: today
      });
    } catch (error) {
      console.error('Failed to save symptom log:', error);
    } finally {
      setIsSavingSymptoms(false);
    }
  }, []);

  const handleSavePeriod = useCallback(async (startDate: Date, endDate?: Date, intensity?: string) => {
    // Check if there's an active period (started but not ended yet)
    const hasActivePeriod = lastPeriodLog && !lastPeriodLog.endDate;

    if (hasActivePeriod) {
      // Update existing period with end date if provided
      const optimisticLog = {
        ...lastPeriodLog,
        endDate: endDate || lastPeriodLog.endDate,
        flowIntensity: intensity || lastPeriodLog.flowIntensity
      };
      setIsPeriodModalOpen(false);

      try {
        await api.post('/api/clients/me/period-logs', optimisticLog);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (error) {
        console.error('Failed to update period log:', error);
      }
    } else {
      // Create new period log
      const optimisticLog = { startDate, endDate, flowIntensity: intensity };

      setIsPeriodModalOpen(false);

      try {
        await api.post('/api/clients/me/period-logs', optimisticLog);
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      } catch (error) {
        console.error('Failed to save period log:', error);
      }
    }
  }, [lastPeriodLog, queryClient]);

  const handleSaveCycleSettings = useCallback(async (length: number) => {
    try {
      await api.patch('/api/client/profile', { cycleLength: length });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsCycleSettingsOpen(false);
      toast.success('Cycle settings updated');
    } catch (error) {
      console.error('Failed to update cycle settings:', error);
      toast.error('Failed to update settings');
    }
  }, [queryClient]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const dismissWelcome = useCallback(async () => {
    setShowWelcome(false);
    try {
      await AsyncStorage.setItem('welcome_banner_dismissed', 'true');
    } catch (e) {
      console.error('Failed to save welcome dismissal:', e);
    }
  }, []);

  // Logic to determine weight values
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : (profile?.weight || 0);
  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : currentWeight;
  const idealWeight = profile?.idealWeight || (profile?.weight || 0);

  const addWaterMutation = useMutation({
    mutationFn: async (vars: { increment: number }) => {
      const today = getLocalDateString();
      return api.post('/api/clients/me/water-intake', {
        increment: vars.increment,
        date: today
      });
    },
    onMutate: async (vars) => {
      const today = getLocalDateString();
      const queryKey = ['dashboard', today];

      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old || !old.waterData) return old;
        return {
          ...old,
          waterData: {
            ...old.waterData,
            currentGlasses: Math.max(0, old.waterData.currentGlasses + vars.increment)
          }
        };
      });

      return { previousData, queryKey };
    },
    onError: (err, newTodo, context) => {
      if (context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error('Failed to add water');
    },
    onSettled: () => {
      const today = getLocalDateString();
      queryClient.invalidateQueries({ queryKey: ['dashboard', today] });
    },
  });

  const handleAddWater = useCallback(() => {
    if (addWaterMutation.isPending) return;
    addWaterMutation.mutate({ increment: 1 });
    toast.success('Water logged!', { duration: 1000 });
  }, [addWaterMutation]);

  const handleRemoveWater = useCallback(() => {
    if (addWaterMutation.isPending) return;
    if ((waterData?.currentGlasses || 0) > 0) {
      addWaterMutation.mutate({ increment: -1 });
      toast.success('Water intake reduced', { duration: 1000 });
    }
  }, [addWaterMutation, waterData]);

  const weightMutation = useMutation({
    mutationFn: async (vars: { weight: number, unit: string, date: Date }) => {
      return api.post('/api/clients/me/weight-logs', vars);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Weight updated successfully');
    },
    onError: () => {
      toast.error('Failed to update weight');
    }
  });

  const handleSaveWeight = useCallback(async (weight: number, unit: 'kg' | 'lb', date: Date) => {
    await weightMutation.mutateAsync({ weight, unit, date });
  }, [weightMutation]);

  const measureMutation = useMutation({
    mutationFn: async (vars: { measurements: any, unit: string, date: Date }) => {
      return api.post('/api/clients/me/measurement-logs', { ...vars.measurements, unit: vars.unit, date: vars.date });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Measurements updated');
    },
    onError: () => {
      toast.error('Failed to update measurements');
    }
  });

  const handleSaveMeasurement = useCallback(async (measurements: any, unit: string, date: Date) => {
    await measureMutation.mutateAsync({ measurements, unit, date });
  }, [measureMutation]);

  const mealMutation = useMutation({
    mutationFn: async (vars: {
      category: string;
      items: { name: string; quantity: string }[];
      date?: Date;
      hungerLevel?: number;
      satisfactionLevel?: number;
      emotionalState?: string;
      isTreat?: boolean;
    }) => {
      return api.post('/api/clients/me/meal-logs', vars);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Meal logged!');
    },
    onError: () => {
      toast.error('Failed to log meal');
    }
  });

  const handleSaveMeal = useCallback(async (
    category: string,
    items: { name: string; quantity: string }[],
    stats?: { hungerLevel: number; satisfactionLevel: number; emotionalState: string; isTreat: boolean; }
  ) => {
    await mealMutation.mutateAsync({ category, items, ...stats, date: new Date() });
  }, [mealMutation]);

  const handleEditMeal = useCallback((category: string, items: any[]) => {
    setEditMealData({ category, items });
    setIsMealModalOpen(true);
  }, []);

  const handleCloseMealModal = useCallback(() => {
    setIsMealModalOpen(false);
    setEditMealData(null); // Reset edit data on close
  }, []);

  if (isError) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '20', width: 64, height: 64, borderRadius: 32, marginBottom: 24 }]}>
          <X size={32} color={theme.brandForest} />
        </View>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text, marginBottom: 8, textAlign: 'center' }}>
          Dashboard Unavailable
        </Text>
        <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
          We couldn't load your data right now. Please check your internet connection and try again.
        </Text>
        <TouchableOpacity
          style={[styles.updateButton, { backgroundColor: theme.brandSage, width: '100%', maxWidth: 300, paddingVertical: 16 }]}
          onPress={() => refetch()}
        >
          <Text style={styles.updateButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || (!data && !isError)) {
    return (
      <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.scrollContent, { paddingTop: insets.top + 24 }]}>
          <View style={styles.header}>
            <View style={[styles.skeleton, { width: 150, height: 40, borderRadius: 12 }]} />
            <View style={[styles.skeleton, { width: 44, height: 44, borderRadius: 22 }]} />
          </View>
          <View style={styles.content}>
            <View style={[styles.skeleton, { width: '100%', height: 160, borderRadius: 24 }]} />
            <View style={[styles.skeleton, { width: '100%', height: 120, borderRadius: 24 }]} />
            <View style={[styles.skeleton, { width: '100%', height: 140, borderRadius: 24 }]} />
            <View style={[styles.skeleton, { width: '100%', height: 160, borderRadius: 24 }]} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <ScrollView
        keyboardDismissMode="on-drag"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={theme.brandSage} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={[styles.userName, { color: theme.brandForest }]}>
              {profile?.name || user?.email?.split('@')[0]}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.avatarButton, { backgroundColor: theme.brandSage, zIndex: 2001 }]}
              onPress={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              activeOpacity={0.7}
            >
              <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</Text>
            </TouchableOpacity>

            <Modal
              visible={isProfileMenuOpen}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setIsProfileMenuOpen(false)}
            >
              <View style={styles.fullMenuOverlay}>
                <View style={[styles.fullMenuContent, { backgroundColor: theme.background }]}>
                  <View style={[styles.fullMenuHeader, { paddingTop: insets.top + 20 }]}>
                    <TouchableOpacity
                      onPress={() => setIsProfileMenuOpen(false)}
                      style={styles.fullMenuCloseButton}
                    >
                      <X size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.fullMenuTitle, { color: theme.text }]}>Profile Menu</Text>
                    <View style={{ width: 40 }} />
                  </View>

                  <ScrollView contentContainerStyle={styles.fullMenuScroll}>
                    <View style={styles.fullMenuUserInfo}>
                      <View style={[styles.fullMenuAvatar, { backgroundColor: theme.brandSage }]}>
                        <Text style={styles.fullMenuAvatarText}>{profile?.name?.[0]?.toUpperCase() || 'U'}</Text>
                      </View>
                      <View style={{ backgroundColor: 'transparent' }}>
                        <Text style={[styles.fullMenuUserName, { color: theme.text }]}>{profile?.name || 'User'}</Text>
                        <Text style={styles.fullMenuUserEmail}>{user?.email}</Text>
                      </View>
                    </View>

                    {assessment && (
                      <TouchableOpacity
                        style={[styles.fullMenuScoreCard, { backgroundColor: theme.brandForest }]}
                        onPress={() => {
                          setIsProfileMenuOpen(false);
                          router.push('/audit');
                        }}
                      >
                        <View style={{ flex: 1, gap: 4, backgroundColor: 'transparent' }}>
                          <Text style={styles.fullMenuScoreTitle}>Health Score</Text>
                          <Text style={styles.fullMenuScoreDesc}>Based on your latest assessment</Text>
                        </View>
                        <View style={[styles.fullMenuScoreCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                          <Text style={styles.fullMenuScoreValue}>{assessment.totalScore}</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    <View style={styles.fullMenuList}>
                      <TouchableOpacity
                        style={styles.fullMenuListItem}
                        onPress={() => {
                          setIsProfileMenuOpen(false);
                          router.push('/profile');
                        }}
                      >
                        <View style={[styles.fullMenuIconBox, { backgroundColor: '#f1f5f9' }]}>
                          <UserIcon size={20} color="#64748b" />
                        </View>
                        <Text style={[styles.fullMenuListItemText, { color: theme.text }]}>Edit Profile</Text>
                        <ChevronRight size={20} color="#cbd5e1" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.fullMenuListItem}
                        onPress={() => {
                          setIsProfileMenuOpen(false);
                          router.push('/contact');
                        }}
                      >
                        <View style={[styles.fullMenuIconBox, { backgroundColor: '#f1f5f9' }]}>
                          <Phone size={20} color="#64748b" />
                        </View>
                        <Text style={[styles.fullMenuListItemText, { color: theme.text }]}>Contact & Support</Text>
                        <ChevronRight size={20} color="#cbd5e1" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.fullMenuListItem}
                        onPress={() => {
                          setIsProfileMenuOpen(false);
                          router.push('/settings');
                        }}
                      >
                        <View style={[styles.fullMenuIconBox, { backgroundColor: '#f1f5f9' }]}>
                          <Settings size={20} color="#64748b" />
                        </View>
                        <Text style={[styles.fullMenuListItemText, { color: theme.text }]}>Settings</Text>
                        <ChevronRight size={20} color="#cbd5e1" />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.fullMenuListItem}
                        onPress={() => {
                          setIsProfileMenuOpen(false);
                          router.push('/refer-earn');
                        }}
                      >
                        <View style={[styles.fullMenuIconBox, { backgroundColor: '#f1f5f9' }]}>
                          <Gift size={20} color="#64748b" />
                        </View>
                        <Text style={[styles.fullMenuListItemText, { color: theme.text }]}>Refer & Earn</Text>
                        <ChevronRight size={20} color="#cbd5e1" />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.fullMenuLogoutButton}
                      onPress={logout}
                    >
                      <LogOut size={20} color="#ef4444" />
                      <Text style={styles.fullMenuLogoutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <Text style={styles.fullMenuVersion}>Version 1.0.0</Text>
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        </View>

        <View style={styles.content}>
          {profile?.status === 'PAUSED' && (
            <View style={styles.row}>
              <View style={styles.col}>
                <View style={[styles.leadCard, { backgroundColor: '#fffbeb', borderColor: '#fcd34d', borderWidth: 1, marginBottom: 12 }]}>
                  <View style={[styles.leadIconContainer, { backgroundColor: '#f59e0b' }]}>
                    <ShieldAlert size={24} color="#fff" />
                  </View>
                  <View style={[styles.leadTextContainer, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.leadTitle, { color: '#b45309' }]}>Plan Paused</Text>
                    <Text style={[styles.leadSubtitle, { color: '#b45309' }]}>
                      Your diet plan is currently paused. Please contact your dietician to resume.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {profile?.status !== 'ACTIVE' && profile?.status !== 'PAUSED' && (
            <TouchableOpacity
              style={[styles.bookAppointmentCard, { backgroundColor: theme.brandForest }]}
              onPress={() => setIsBookAppointmentOpen(true)}
              activeOpacity={0.9}
            >
              <View style={[styles.bookIconContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Calendar size={28} color="#FFF" />
              </View>
              <View style={[styles.bookTextContainer, { backgroundColor: 'transparent' }]}>
                <Text style={styles.bookTitle}>Book Appointment</Text>
                <Text style={styles.bookSubtitle}>Schedule a session with your dietician</Text>
              </View>
              <View style={[styles.bookArrow, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={{ color: '#FFF', fontSize: 20 }}>→</Text>
              </View>
            </TouchableOpacity>
          )}

          {profile?.primaryGoal && (
            <View style={[styles.goalBanner, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
              <View style={[styles.goalIconContainer, { backgroundColor: theme.brandSage + '10' }]}>
                <Target size={20} color={theme.brandSage} />
              </View>
              <View style={styles.goalTextContainer}>
                <Text style={styles.goalLabel}>Focusing on</Text>
                <Text style={[styles.goalValue, { color: theme.brandForest }]}>
                  {Array.isArray(profile.primaryGoal) ? profile.primaryGoal.join(', ') : profile.primaryGoal}
                </Text>
              </View>
            </View>
          )}

          {showWelcome && (
            <View style={styles.row}>
              <View style={styles.col}>
                <View style={[styles.leadCard, { backgroundColor: theme.brandForest }]}>
                  <View style={[styles.leadIconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <Sparkles size={24} color="#fff" />
                  </View>
                  <View style={[styles.leadTextContainer, { backgroundColor: 'transparent' }]}>
                    <Text style={styles.leadTitle}>Welcome to DateWithDiet!</Text>
                    <Text style={styles.leadSubtitle}>
                      Your dietician will review your profile and reach out soon. Start logging your water and weight to kickstart your journey!
                    </Text>
                  </View>
                  <TouchableOpacity onPress={dismissWelcome} style={styles.dismissButton}>
                    <X size={20} color="rgba(255,255,255,0.6)" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.col}>
              <WeightTracker
                currentWeight={currentWeight}
                startWeight={startWeight}
                idealWeight={idealWeight}
                onPress={() => setIsWeightModalOpen(true)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <SymptomCheckIn
                onSave={handleSaveSymptoms}
                isSaving={isSavingSymptoms}
              />
            </View>
          </View>

          {profile?.gender === 'female' && (
            <View style={styles.row}>
              <View style={styles.col}>
                <CycleTrackerCard
                  status={cycleStatus}
                  onLogPress={() => setIsPeriodModalOpen(true)}
                  onSettingsPress={() => setIsCycleSettingsOpen(true)}
                />
              </View>
            </View>
          )}

          <View style={styles.row}>
            <View style={styles.col}>
              {waterData && (
                <WaterTracker
                  currentGlasses={waterData.currentGlasses}
                  targetGlasses={waterData.targetGlasses}
                  onAdd={handleAddWater}
                  onRemove={handleRemoveWater}
                />
              )}
            </View>
          </View>

          <MeasurementTracker
            logs={measurementLogs}
            onUpdateClick={() => setIsMeasurementModalOpen(true)}
          />

          <MealLogCard
            logs={mealLogs}
            onAdd={() => {
              setEditMealData(null); // Ensure fresh add
              setIsMealModalOpen(true);
            }}
            onEdit={handleEditMeal}
          />
        </View>
      </ScrollView>

      <LogWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onSave={handleSaveWeight}
        initialWeight={currentWeight}
      />

      <LogMeasurementModal
        isOpen={isMeasurementModalOpen}
        onClose={() => setIsMeasurementModalOpen(false)}
        onSave={handleSaveMeasurement}
        initialValues={measurementLogs[0] ? {
          chest: measurementLogs[0].chest,
          arms: measurementLogs[0].arms,
          waist: measurementLogs[0].waist,
          hips: measurementLogs[0].hips,
          thigh: measurementLogs[0].thigh,
        } : undefined}
      />

      <LogPeriodModal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        onSave={handleSavePeriod}
        lastPeriodLog={lastPeriodLog}
      />

      <CycleSettingsModal
        isOpen={isCycleSettingsOpen}
        onClose={() => setIsCycleSettingsOpen(false)}
        onSave={handleSaveCycleSettings}
        initialLength={profile?.cycleLength}
      />

      <LogMealModal
        isOpen={isMealModalOpen}
        onClose={handleCloseMealModal}
        onSave={handleSaveMeal}
        initialCategory={editMealData?.category}
        initialItems={editMealData?.items}
        existingLogs={mealLogs}
      />

      <BookAppointmentModal
        isOpen={isBookAppointmentOpen}
        onClose={() => setIsBookAppointmentOpen(false)}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  updateButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalBanner: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  goalTextContainer: {
    flex: 1,
  },
  goalLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  leadCard: {
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    position: 'relative',
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  leadIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadTextContainer: {
    flex: 1,
    gap: 4,
  },
  leadTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  leadSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 24, // Padding handled by contentContainer style dynamically
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    zIndex: 1000, // Ensure header actions stay on top
    elevation: 1000,
  },
  greeting: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
  },
  menuOverlay: {
    position: 'absolute',
    top: -100, // Extend well beyond header
    right: -100,
    bottom: -1000, // Cover entire screen height
    left: -1000, // Cover entire screen width
    width: 2000,
    height: 3000,
    backgroundColor: 'rgba(0,0,0,0)', // Transparent
    zIndex: 1500, // Below dropdown (2000) but above content
  },
  menuDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 320, // Wider for score card
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, // More pronounced shadow
    shadowRadius: 20,
    elevation: 1001, // Higher than components below
    borderWidth: 1,
    borderColor: '#f1f5f9',
    zIndex: 2000, // Very high to overlay everything
  },
  menuHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  menuLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  menuEmail: {
    fontSize: 12,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  content: {
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 20,
  },
  col: {
    flex: 1,
  },
  auditCard: {
    padding: 24,
    borderRadius: 32,
    marginTop: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  auditInfo: {
    gap: 8,
    marginBottom: 20,
  },
  auditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  auditBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  auditTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
  },
  auditSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  auditAction: {
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  auditButtonText: {
    color: '#1B4332',
    fontWeight: '900',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  skeleton: {
    backgroundColor: '#f1f5f9',
  },
  bookAppointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    gap: 16,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 8,
  },
  bookIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTextContainer: {
    flex: 1,
    gap: 4,
  },
  bookTitle: {
    fontSize: 22, // Increased from 18 to 22 for better visibility
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  bookSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  bookArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCard: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scoreInfo: {
    flex: 1,
    gap: 4,
  },
  scoreTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  scoreDesc: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16,
  },
  menuScoreCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  menuScoreValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#334155',
  },
  fullMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  fullMenuContent: {
    flex: 1,
  },
  fullMenuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  fullMenuCloseButton: {
    padding: 8,
    borderRadius: 12,
  },
  fullMenuTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  fullMenuScroll: {
    padding: 24,
  },
  fullMenuUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 32,
  },
  fullMenuAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMenuAvatarText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
  },
  fullMenuUserName: {
    fontSize: 18,
    fontWeight: '800',
  },
  fullMenuUserEmail: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  fullMenuScoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 24,
    marginBottom: 32,
  },
  fullMenuScoreTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  fullMenuScoreDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  fullMenuScoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMenuScoreValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
  },
  fullMenuList: {
    gap: 12,
    marginBottom: 32,
  },
  fullMenuListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    gap: 16,
  },
  fullMenuIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMenuListItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  fullMenuLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fee2e2',
    backgroundColor: '#fef2f2',
    marginBottom: 32,
  },
  fullMenuLogoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  fullMenuVersion: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { User as UserIcon, LogOut, Target, Sparkles, X, Phone, Trash2, Settings, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateCycleStatus } from '@/lib/cycle-utils';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useQueryClient, useMutation } from '@tanstack/react-query';
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
  const { data, isLoading, refetch, isRefetching } = useDashboardData(!!user);

  // Derived state from Query Data
  const profile = data?.profile;
  const weightLogs = data?.weightLogs || [];
  const waterData = data?.waterData;
  const mealLogs = data?.mealLogs || [];
  const measurementLogs = data?.measurementLogs || [];
  const cycleStatus = data?.cycleStatus;
  const lastPeriodLog = data?.lastPeriodLog;

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
    // Check if there's an active period (started within last 10 days)
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const hasActivePeriod = lastPeriodLog &&
      new Date(lastPeriodLog.startDate) > tenDaysAgo &&
      !lastPeriodLog.endDate;

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
    mutationFn: async () => {
      const today = getLocalDateString();
      return api.post('/api/clients/me/water-intake', {
        increment: 1,
        date: today
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });
      const previousData = queryClient.getQueryData(['dashboard']);

      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old || !old.waterData) return old;
        return {
          ...old,
          waterData: {
            ...old.waterData,
            currentGlasses: old.waterData.currentGlasses + 1
          }
        };
      });

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['dashboard'], context?.previousData);
      toast.error('Failed to add water');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleAddWater = useCallback(() => {
    addWaterMutation.mutate();
    toast.success('Water logged!', { duration: 1000 });
  }, [addWaterMutation]);

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
    mutationFn: async (vars: { category: string, items: { name: string; quantity: string }[], date?: Date }) => {
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

  const handleSaveMeal = useCallback(async (category: string, items: { name: string; quantity: string }[]) => {
    await mealMutation.mutateAsync({ category, items, date: new Date() });
  }, [mealMutation]);

  const handleEditMeal = useCallback((category: string, items: any[]) => {
    setEditMealData({ category, items });
    setIsMealModalOpen(true);
  }, []);

  const handleCloseMealModal = useCallback(() => {
    setIsMealModalOpen(false);
    setEditMealData(null); // Reset edit data on close
  }, []);

  if (isLoading) {
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

            {isProfileMenuOpen && (
              <>
                {/* Transparent Overlay to close menu on outside click */}
                <TouchableOpacity
                  style={styles.menuOverlay}
                  activeOpacity={1}
                  onPress={() => setIsProfileMenuOpen(false)}
                />
                <View style={[styles.menuDropdown, { backgroundColor: theme.background }]}>
                  <View style={styles.menuHeader}>
                    <Text style={styles.menuLabel}>Logged in as</Text>
                    <Text style={[styles.menuEmail, { color: theme.brandForest }]} numberOfLines={1}>
                      {user?.email}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/profile');
                    }}
                  >
                    <UserIcon size={18} color="#64748b" />
                    <Text style={styles.menuItemText}>Edit Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/contact');
                    }}
                  >
                    <Phone size={18} color="#64748b" />
                    <Text style={styles.menuItemText}>Contact</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setIsProfileMenuOpen(false);
                      router.push('/settings');
                    }}
                  >
                    <Settings size={18} color="#64748b" />
                    <Text style={styles.menuItemText}>Settings</Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={logout}
                  >
                    <LogOut size={18} color="#64748b" />
                    <Text style={styles.menuItemText}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.content}>
          {user?.status !== 'ACTIVE' && (
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
    width: 220, // Slightly wider for better text handling
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
});

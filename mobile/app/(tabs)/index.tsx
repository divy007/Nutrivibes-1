import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { User as UserIcon, LogOut, Target, Sparkles, X, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { calculateCycleStatus } from '@/lib/cycle-utils';

import WeightTracker from '@/components/dashboard/WeightTracker';
import WaterTracker from '@/components/dashboard/WaterTracker';
import MealLogCard from '@/components/dashboard/MealLogCard';
import LogWeightModal from '@/components/dashboard/LogWeightModal';
import MeasurementTracker from '@/components/dashboard/MeasurementTracker';
import LogMeasurementModal from '@/components/dashboard/LogMeasurementModal';
import LogMealModal from '@/components/dashboard/LogMealModal';
import { SymptomCheckIn } from '@/components/dashboard/SymptomCheckIn';
import { CycleTrackerCard } from '@/components/dashboard/CycleTrackerCard';
import LogPeriodModal from '@/components/dashboard/LogPeriodModal';
import { getLocalDateString } from '@/lib/date-utils';

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [waterData, setWaterData] = useState<any>(null);
  const [mealLogs, setMealLogs] = useState<any[]>([]);
  const [measurementLogs, setMeasurementLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSavingSymptoms, setIsSavingSymptoms] = useState(false);
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [cycleStatus, setCycleStatus] = useState<any>(null);
  const [lastPeriodLog, setLastPeriodLog] = useState<any>(null);

  const colorScheme = useColorScheme();
  const theme = (Colors as any)[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const fetchData = useCallback(async () => {
    try {
      const today = getLocalDateString();
      const data = await api.get<any>(`/api/clients/me/dashboard?date=${today}`);
      setProfile(data.profile);
      setWeightLogs(data.weightLogs || []);
      setWaterData(data.waterData);
      setMealLogs(data.mealLogs || []);
      setMeasurementLogs(data.measurementLogs || []);
      setCycleStatus(data.cycleStatus);
      setLastPeriodLog(data.lastPeriodLog);

      // Check if welcome banner should be shown
      if (data.profile && data.profile.status === 'LEAD' && data.profile.registrationSource === 'MOBILE_APP') {
        const dismissed = await AsyncStorage.getItem('welcome_banner_dismissed');
        if (!dismissed) {
          setShowWelcome(true);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch dashboard data:', error);
      const errorMessage = error.message || 'Failed to fetch dashboard data';
      Alert.alert('Dashboard Error', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const handleSaveSymptoms = async (symptoms: string[], energyLevel: number) => {
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
  };

  const handleSavePeriod = async (startDate: Date, endDate?: Date, intensity?: string) => {
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
      setLastPeriodLog(optimisticLog);
      setIsPeriodModalOpen(false);

      try {
        await api.post('/api/clients/me/period-logs', optimisticLog);
      } catch (error) {
        console.error('Failed to update period log:', error);
      }
    } else {
      // Create new period log
      const optimisticLog = { startDate, endDate, flowIntensity: intensity };
      const optimisticStatus = calculateCycleStatus(startDate, profile?.cycleLength || 28, new Date());

      setLastPeriodLog(optimisticLog);
      setCycleStatus(optimisticStatus);
      setIsPeriodModalOpen(false);

      try {
        await api.post('/api/clients/me/period-logs', optimisticLog);
      } catch (error) {
        console.error('Failed to save period log:', error);
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const dismissWelcome = async () => {
    setShowWelcome(false);
    try {
      await AsyncStorage.setItem('welcome_banner_dismissed', 'true');
    } catch (e) {
      console.error('Failed to save welcome dismissal:', e);
    }
  };

  // Logic to determine weight values
  const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : (profile?.weight || 0);
  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : currentWeight;
  const idealWeight = profile?.idealWeight || (profile?.weight || 0);

  const handleAddWater = async () => {
    // OPTIMISTIC UPDATE
    if (waterData) {
      setWaterData({
        ...waterData,
        currentGlasses: waterData.currentGlasses + 1
      });
    }

    try {
      const today = getLocalDateString();
      await api.post('/api/clients/me/water-intake', {
        increment: 1,
        date: today
      });
    } catch (error) {
      console.error('Failed to add water:', error);
      // Revert if failed
      setWaterData((prev: any) => ({ ...prev, currentGlasses: prev.currentGlasses - 1 }));
    }
  };

  const handleSaveWeight = async (weight: number, unit: 'kg' | 'lb', date: Date) => {
    try {
      await api.post('/api/clients/me/weight-logs', { weight, unit, date });
      await fetchData();
    } catch (error) {
      console.error('Failed to save weight:', error);
      throw error;
    }
  };

  const handleSaveMeasurement = async (measurements: any, unit: string, date: Date) => {
    try {
      await api.post('/api/clients/me/measurement-logs', { ...measurements, unit, date });
      await fetchData();
    } catch (error) {
      console.error('Failed to save measurement:', error);
      throw error;
    }
  };

  const handleSaveMeal = async (category: string, items: { name: string; quantity: string }[]) => {
    try {
      await api.post('/api/clients/me/meal-logs', { category, items });
      await fetchData();
    } catch (error) {
      console.error('Failed to save meal:', error);
      throw error;
    }
  };

  if (loading && !refreshing) {
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.brandSage} />
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

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={logout}
                  >
                    <LogOut size={18} color="#ef4444" />
                    <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Sign Out</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.content}>
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
                    <Text style={styles.leadTitle}>Welcome to NutriVibes!</Text>
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
            onAdd={() => setIsMealModalOpen(true)}
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

      <LogMealModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onSave={handleSaveMeal}
      />
    </View >
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  goalBanner: {
    padding: 24,
    borderRadius: 32,
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
    width: 40,
    height: 40,
    borderRadius: 12,
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
  }
});

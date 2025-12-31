import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Activity, Bell, User as UserIcon, LogOut } from 'lucide-react-native';

import WeightTracker from '@/components/dashboard/WeightTracker';
import WaterTracker from '@/components/dashboard/WaterTracker';
import MealLogCard from '@/components/dashboard/MealLogCard';
import LogWeightModal from '@/components/dashboard/LogWeightModal';
import MeasurementTracker from '@/components/dashboard/MeasurementTracker';
import LogMeasurementModal from '@/components/dashboard/LogMeasurementModal';
import LogMealModal from '@/components/dashboard/LogMealModal';

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

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isMeasurementModalOpen, setIsMeasurementModalOpen] = useState(false);
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const fetchData = useCallback(async () => {
    try {
      const [profileData, weightData, waterIntake, meals, measurements] = await Promise.all([
        api.get('/api/clients/me'),
        api.get('/api/clients/me/weight-logs'),
        api.get('/api/clients/me/water-intake'),
        api.get('/api/clients/me/meal-logs'),
        api.get('/api/clients/me/measurement-logs'),
      ]);
      setProfile(profileData);
      setWeightLogs(weightData as any[]);
      setWaterData(waterIntake);
      setMealLogs(meals as any[]);
      setMeasurementLogs(measurements as any[]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const currentWeight = profile?.weight || 0;
  const startWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : currentWeight;
  const idealWeight = profile?.idealWeight || currentWeight;

  const handleAddWater = async () => {
    try {
      await api.post('/api/clients/me/water-intake', { increment: 1 });
      fetchData();
    } catch (error) {
      console.error('Failed to add water:', error);
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <Activity size={40} color={theme.brandSage} />
        <Text style={[styles.loadingText, { color: theme.brandForest }]}>Loading your wellness data...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
              style={[styles.avatarButton, { backgroundColor: theme.brandSage }]}
              onPress={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}</Text>
            </TouchableOpacity>

            {isProfileMenuOpen && (
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

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={logout}
                >
                  <LogOut size={18} color="#ef4444" />
                  <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.content}>
          <MealLogCard
            logs={mealLogs}
            onAdd={() => setIsMealModalOpen(true)}
          />

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

          {/* Wellness Audit CTA mirroring the web design */}
          <View
            style={[styles.auditCard, { backgroundColor: theme.brandForest }]}
          >
            <View style={styles.auditInfo}>
              <View style={styles.auditBadge}>
                <Activity size={12} color="#FFF" />
                <Text style={styles.auditBadgeText}>Wellness Audit</Text>
              </View>
              <Text style={styles.auditTitle}>Concerned About weight?</Text>
              <Text style={styles.auditSub}>Take our 2-minute 'Health Audit' to uncover metabolic barriers.</Text>
            </View>
            <TouchableOpacity
              style={styles.auditAction}
              onPress={() => router.push('/(tabs)/audit')}
            >
              <Text style={styles.auditButtonText}>Start Audit</Text>
            </TouchableOpacity>
          </View>
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

      <LogMealModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onSave={handleSaveMeal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
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
  menuDropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 200,
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    zIndex: 1000,
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
  }
});

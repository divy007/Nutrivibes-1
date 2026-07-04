import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Users, UserCheck, UserX, AlertCircle, Clock, Calendar, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Stats {
  activeClients: number;
  newClients: number;
  pausedClients: number;
  expiredClients: number;
  leadsCount: number;
  todayFollowUps: { id: string; name: string; color: string }[];
  analysis?: {
    dietPendingCount: number;
    dietPendingCounts: {
      red: number;
      yellow: number;
      black: number;
    };
    dietPendingList: { id: string; name: string; color: string; originalColor: string }[];
  };
}

export default function DieticianDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'followup' | 'pending'>('pending');

  const fetchStats = async () => {
    try {
      const data = await api.get<Stats>('/api/dietician/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.brandForest} />
      </View>
    );
  }

  const pendingList = stats?.analysis?.dietPendingList || [];
  const followUpList = stats?.todayFollowUps || [];

  const handleClientPress = (clientId: string) => {
    if (clientId) {
      router.push(`/(dietician)/clients/${clientId}` as any);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[theme.brandForest]} 
          tintColor={theme.brandForest} 
        />
      }
    >
      {/* Welcome Banner */}
      <View style={[styles.welcomeBanner, { backgroundColor: theme.brandForest }]}>
        <Text style={styles.welcomeTitle}>Good morning, {user?.name || 'Dietician'}! 👋</Text>
        <Text style={styles.welcomeSubtitle}>
          You have {stats?.analysis?.dietPendingCount || 0} diet plans pending action today.
        </Text>
      </View>

      {/* Bento Stats Grid */}
      <View style={styles.grid}>
        <View style={[styles.card, { borderColor: theme.brandForest + '15' }]}>
          <Users size={20} color={theme.brandForest} />
          <Text style={[styles.cardValue, { color: theme.brandForest }]}>{stats?.activeClients || 0}</Text>
          <Text style={styles.cardLabel}>Active Clients</Text>
        </View>

        <View style={[styles.card, { borderColor: theme.brandForest + '15' }]}>
          <UserCheck size={20} color={theme.brandSage} />
          <Text style={[styles.cardValue, { color: theme.brandSage }]}>{stats?.newClients || 0}</Text>
          <Text style={styles.cardLabel}>New Clients</Text>
        </View>

        <View style={[styles.card, { borderColor: theme.brandForest + '15' }]}>
          <Clock size={20} color={theme.brandEarth} />
          <Text style={[styles.cardValue, { color: theme.brandEarth }]}>{stats?.pausedClients || 0}</Text>
          <Text style={styles.cardLabel}>Paused Clients</Text>
        </View>

        <View style={[styles.card, { borderColor: theme.brandForest + '15' }]}>
          <AlertCircle size={20} color="#e11d48" />
          <Text style={[styles.cardValue, { color: '#e11d48' }]}>{stats?.expiredClients || 0}</Text>
          <Text style={styles.cardLabel}>Expired Subs</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'pending' && [styles.activeTabButton, { backgroundColor: theme.brandForest + '12' }]]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && { color: theme.brandForest, fontWeight: '700' }]}>
            Pending Diets ({pendingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'followup' && [styles.activeTabButton, { backgroundColor: theme.brandForest + '12' }]]}
          onPress={() => setActiveTab('followup')}
        >
          <Text style={[styles.tabText, activeTab === 'followup' && { color: theme.brandForest, fontWeight: '700' }]}>
            Follow-ups ({followUpList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Client List */}
      <View style={styles.listContainer}>
        {activeTab === 'pending' ? (
          pendingList.length > 0 ? (
            pendingList.map((item) => {
              // Map color names to hex codes for UI
              let dotColor = '#f59e0b'; // yellow fallback
              if (item.originalColor === 'black') dotColor = '#1e293b';
              else if (item.originalColor === 'red') dotColor = '#ef4444';

              return (
                <TouchableOpacity 
                  key={item.id + '-pending'} 
                  style={[styles.listItem, { borderBottomColor: '#f1f5f9' }]}
                  onPress={() => handleClientPress(item.id)}
                >
                  <View style={styles.listItemLeft}>
                    <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
                    <Text style={styles.clientName}>{item.name}</Text>
                  </View>
                  <View style={styles.listItemRight}>
                    <Text style={[styles.actionLabel, { color: theme.brandForest }]}>Planner</Text>
                    <ChevronRight size={16} color="#94a3b8" />
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>All diet plans are up to date! 🎉</Text>
            </View>
          )
        ) : (
          followUpList.length > 0 ? (
            followUpList.map((item) => (
              <TouchableOpacity 
                key={item.id + '-followup'} 
                style={[styles.listItem, { borderBottomColor: '#f1f5f9' }]}
                onPress={() => handleClientPress(item.id)}
              >
                <View style={styles.listItemLeft}>
                  <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
                  <Text style={styles.clientName}>{item.name}</Text>
                </View>
                <View style={styles.listItemRight}>
                  <Text style={[styles.actionLabel, { color: theme.brandForest }]}>Log Note</Text>
                  <ChevronRight size={16} color="#94a3b8" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Calendar size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No follow-ups scheduled for today.</Text>
            </View>
          )
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeBanner: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    // shadow effects or border style
  },
  tabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  listContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 180,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  listItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
});

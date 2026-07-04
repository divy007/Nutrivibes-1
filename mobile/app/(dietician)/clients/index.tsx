import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Search, ChevronRight, User, Calendar, AlertTriangle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Client {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'PAUSED' | 'NEW' | 'DELETED' | 'LEAD';
  gender?: string;
  age?: number;
  primaryGoal?: string[];
  dietStatus: 'green' | 'yellow' | 'red' | 'black';
  hasFollowUpToday: boolean;
  isSubscriptionExpired: boolean;
  counsellingProfile?: {
    medicalConditions?: string[];
  };
}

export default function ClientListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'FOLLOWUP'>('ALL');

  const fetchClients = async () => {
    try {
      const data = await api.get<Client[]>('/api/clients');
      setClients(data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const getFilteredClients = () => {
    return clients.filter((client) => {
      // 1. Filter by Search Query
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (client.phone && client.phone.includes(searchQuery)) ||
        (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // 2. Filter by Status Tabs
      if (activeFilter === 'ACTIVE') return client.status === 'ACTIVE';
      if (activeFilter === 'PAUSED') return client.status === 'PAUSED';
      if (activeFilter === 'FOLLOWUP') return client.hasFollowUpToday;

      return client.status !== 'DELETED'; // Don't show deleted by default in 'ALL'
    });
  };

  const filteredClients = getFilteredClients();

  const getStatusColor = (dietStatus: string) => {
    switch (dietStatus) {
      case 'green': return '#10b981';
      case 'yellow': return '#f59e0b';
      case 'red': return '#ef4444';
      case 'black': return '#1e293b';
      default: return '#cbd5e1';
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.brandForest} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={[styles.searchBar, { borderColor: theme.brandForest + '20' }]}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder="Search client by name, phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.text }]}
            placeholderTextColor="#94a3b8"
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {(['ALL', 'ACTIVE', 'PAUSED', 'FOLLOWUP'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTabButton,
              activeFilter === filter && { backgroundColor: theme.brandForest, borderColor: theme.brandForest }
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text
              style={[
                styles.filterTabLabel,
                { color: activeFilter === filter ? '#fff' : '#64748b' }
              ]}
            >
              {filter === 'FOLLOWUP' ? 'Follow-Up' : filter.charAt(0) + filter.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Client List */}
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.brandForest]} 
            tintColor={theme.brandForest} 
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.clientCard, { borderColor: theme.brandForest + '10' }]}
            onPress={() => router.push(`/(dietician)/clients/${item._id}` as any)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={[styles.dietDot, { backgroundColor: getStatusColor(item.dietStatus) }]} />
                <Text style={styles.clientName}>{item.name}</Text>
              </View>
              <View style={[styles.roleBadge, { backgroundColor: item.status === 'ACTIVE' ? '#ecfdf5' : '#fef3c7' }]}>
                <Text style={[styles.roleText, { color: item.status === 'ACTIVE' ? '#10b981' : '#d97706' }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>
                {item.gender ? `${item.gender}` : ''}
                {item.age ? ` • ${item.age} yrs` : ''}
              </Text>
              {item.primaryGoal && item.primaryGoal.length > 0 && (
                <Text style={styles.detailText} numberOfLines={1}>
                  Goal: {item.primaryGoal.join(', ')}
                </Text>
              )}
              {item.isSubscriptionExpired && (
                <View style={styles.alertRow}>
                  <AlertTriangle size={14} color="#ef4444" />
                  <Text style={styles.alertText}>Subscription Expired</Text>
                </View>
              )}
            </View>

            <View style={[styles.cardDivider, { backgroundColor: '#f1f5f9' }]} />

            <View style={styles.cardFooter}>
              <Text style={[styles.footerLink, { color: theme.brandForest }]}>View Profile</Text>
              <ChevronRight size={16} color={theme.brandForest} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <User size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No clients found.</Text>
          </View>
        }
      />
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
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterTabButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  filterTabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  clientCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dietDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardDetails: {
    gap: 4,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  alertText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});

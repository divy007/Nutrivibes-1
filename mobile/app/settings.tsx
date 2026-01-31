
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ChevronLeft, Trash2, PauseCircle, ChevronRight, ShieldAlert, CreditCard } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api-client';
import { PausePlanModal } from '@/components/PausePlanModal';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];

    const [isPauseModalVisible, setPauseModalVisible] = useState(false);

    // We need to fetch subscription details to pass to modal
    const [subscriptionStats, setSubscriptionStats] = useState({ allowed: 0, used: 0 });
    const [pendingRequest, setPendingRequest] = useState<any>(null);

    useEffect(() => {
        // Fetch client details to get subscription info
        const fetchStats = async () => {
            try {
                const res = await api.get<any>('/api/clients/me');

                const activeSub = res.activeSubscription;
                setSubscriptionStats({
                    allowed: activeSub?.planId?.allowedPauseDays || 0,
                    used: activeSub?.pauseDaysUsed || 0
                });

                if (activeSub?.pauseRequests) {
                    const pending = activeSub.pauseRequests.find((r: any) => r.status === 'PENDING');
                    setPendingRequest(pending);
                } else {
                    setPendingRequest(null);
                }

            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, [isPauseModalVisible]); // Refresh when modal closes/opens to check updates

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Call delete API
                            await api.del('/api/clients/me');
                            await logout();
                            router.replace('/login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete account');
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={[styles.sectionTitle, { color: theme.brandSage }]}>Subscription & Plan</Text>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}
                    onPress={() => setPauseModalVisible(true)}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#fff7ed' }]}>
                        <PauseCircle size={22} color="#f97316" />
                    </View>
                    <View style={styles.menuText}>
                        <Text style={[styles.menuTitle, { color: theme.text }]}>Pause Plan</Text>
                        <Text style={[styles.menuSubtitle, { color: theme.secondary }]}>Temporarily halt your diet plan</Text>
                    </View>
                    <ChevronRight size={20} color={theme.secondary} />
                </TouchableOpacity>

                <View style={{ height: 24 }} />
                <Text style={[styles.sectionTitle, { color: theme.brandSage }]}>Account Actions</Text>

                <TouchableOpacity
                    style={[styles.menuItem, { backgroundColor: '#fef2f2', borderColor: '#fee2e2', borderWidth: 1 }]}
                    onPress={handleDeleteAccount}
                >
                    <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                        <Trash2 size={22} color="#ef4444" />
                    </View>
                    <View style={styles.menuText}>
                        <Text style={[styles.menuTitle, { color: '#ef4444' }]}>Delete Account</Text>
                        <Text style={[styles.menuSubtitle, { color: '#f87171' }]}>Permanently remove your data</Text>
                    </View>
                    <ChevronRight size={20} color="#f87171" />
                </TouchableOpacity>

            </ScrollView>

            <PausePlanModal
                visible={isPauseModalVisible}
                onClose={() => setPauseModalVisible(false)}
                allowedPauseDays={subscriptionStats.allowed || 0}
                currentPauseUsed={subscriptionStats.used || 0}
                pendingRequest={pendingRequest}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16 },
    backBtn: { padding: 8, marginHorizontal: -8 },
    title: { fontSize: 20, fontWeight: '800' },
    content: { padding: 20, gap: 12 },
    sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
    menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 8 },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    menuText: { flex: 1 },
    menuTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    menuSubtitle: { fontSize: 12 },
});

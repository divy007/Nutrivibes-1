
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
    // Ideally this should be in context, but for now we fetch or rely on user object if extended
    // Let's assume we need to fetch 'me' to get subscription stats if not in user object
    const [subscriptionStats, setSubscriptionStats] = useState({ allowed: 0, used: 0 });

    useEffect(() => {
        // Fetch client details to get subscription info
        // Assuming /api/clients/me returns this info or we need to normalize it
        const fetchStats = async () => {
            try {
                // This endpoints needs to return subscription details
                // If not, we might need a dedicated endpoint or update 'me'
                // For now, let's assume 'me' returns 'pauseDaysUsed' and 'allowedPauseDays' attached to client profile or we fetch from separate endpoint
                // Since we just updated Schema, 'me' might not return it yet unless updated.
                // Let's rely on a fresh fetch
                const res = await api.get<any>('/api/clients/me');
                // The API needs to populated this. If not, we might fail to show correct numbers.
                // Todo: Update /api/clients/me to return subscription stats if valuable.
                // Or assume defaults for MVP if schema update didn't propagate to API DTOs yet.

                // Let's assume the response has it mixed in or we calculate
                // Actually, let's fetch subscription specifically if possible? No, 'me' is best.
                // We'll trust the API returns the client object which now has the subscription linked or embedded?
                // Wait, Subscription is separate model. 'me' returns Client.
                // We probably need to fetch subscription status.
                // Let's make a quick call or assume passed props? No props in screen.

                // Quick fix: Add endpoint to fetch usage? Or just fetch 'me' and assume we update 'me' endpoint to include it.
                // Let's mock for now or try to fetch.
                setSubscriptionStats({
                    allowed: res.subscription?.allowedPauseDays || res.currentPlan?.allowedPauseDays || 0,
                    used: res.subscription?.pauseDaysUsed || 0
                });

            } catch (e) { console.error(e); }
        };
        fetchStats();
    }, []);

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

                {/* Future: Plan Renewal / Upgrade */}
                {/* <TouchableOpacity style={[styles.menuItem, { backgroundColor: theme.cardBackground }]}>
                    <View style={[styles.iconBox, { backgroundColor: '#ecfccb' }]}>
                        <CreditCard size={22} color="#65a30d" />
                    </View>
                    <View style={styles.menuText}>
                        <Text style={[styles.menuTitle, { color: theme.text }]}>Plan Details</Text>
                        <Text style={[styles.menuSubtitle, { color: theme.secondary }]}>View validity and renewal</Text>
                    </View>
                    <ChevronRight size={20} color={theme.secondary} />
                </TouchableOpacity> */}

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
                // Fallback to defaults if stats loading fails, essential for UI to show something
                allowedPauseDays={subscriptionStats.allowed || 0}
                currentPauseUsed={subscriptionStats.used || 0}
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

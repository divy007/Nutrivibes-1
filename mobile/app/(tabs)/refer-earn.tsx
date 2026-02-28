import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, FlatList, RefreshControl, Text as NativeText, View as NativeView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { UserPlus, Gift, Phone, User, ChevronRight, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

export default function ReferEarnScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Form Data
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    // Data
    const [referrals, setReferrals] = useState<any[]>([]);
    const [rewards, setRewards] = useState<any[]>([]);
    const [subscription, setSubscription] = useState<any>(null);
    const [clientId, setClientId] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await api.get('/api/clients/me') as any;
            setClientId(data._id);
            setReferrals(data.myReferrals || []);
            setRewards(data.referralRewards || []);
            setSubscription(data.activeSubscription);
        } catch (error) {
            console.error('Failed to fetch referrals:', error);
            Alert.alert('Error', 'Failed to load referral data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter friend\'s name');
            return;
        }
        if (phone.length < 7 || phone.length > 15) {
            Alert.alert('Error', 'Please enter a valid phone number (7-15 digits)');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/api/referrals', {
                name: name.trim(),
                phone: phone.trim(),
                referredByClientId: clientId
            });

            Alert.alert('Success', 'Referral submitted successfully!');
            setName('');
            setPhone('');
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error('Referral failed:', error);
            Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to submit referral');
        } finally {
            setSubmitting(false);
        }
    };

    const getRewardForReferral = (referralId: string) => {
        if (!rewards || rewards.length === 0) return null;
        // Check if fromClientId exists and matches (it might be an object or string depending on population)
        return rewards.find(r => {
            const fromId = typeof r.fromClientId === 'object' ? r.fromClientId._id : r.fromClientId;
            return fromId === referralId;
        });
    };

    const StatusBadge = ({ status, referralStatus }: { status: string, referralStatus: string }) => {
        let color = '#64748b'; // Default gray
        let text = 'Pending';
        let icon = <Clock size={12} color={color} />;

        if (referralStatus === 'REWARDED') {
            color = theme.brandSage; // Green
            text = 'Rewarded';
            icon = <Gift size={12} color={color} />;
        } else if (status === 'ACTIVE') {
            color = theme.brandForest; // Dark Green
            text = 'Joined';
            icon = <CheckCircle2 size={12} color={color} />;
        } else if (status === 'LEAD') {
            color = '#f59e0b'; // Amber
            text = 'Lead';
            icon = <Clock size={12} color={color} />;
        }

        return (
            <View style={[styles.badge, { backgroundColor: color + '15', borderColor: color + '30' }]}>
                {icon}
                <Text style={[styles.badgeText, { color: color }]}>{text}</Text>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brandSage} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.brandForest }]}>Refer & Earn</Text>
                <Text style={styles.subtitle}>Invite friends and earn extra subscription days!</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            >
                {/* Subscription Expiry Card */}
                {subscription && (
                    <View style={[styles.expiryCard, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
                        <View style={[styles.expiryIcon, { backgroundColor: theme.brandSage + '10' }]}>
                            <Clock size={20} color={theme.brandSage} />
                        </View>
                        <View style={styles.expiryContent}>
                            <NativeText style={styles.expiryLabel}>Your Plan Expires On</NativeText>
                            <NativeText style={[styles.expiryDate, { color: theme.brandForest }]}>
                                {format(new Date(subscription.endDate), 'MMM dd, yyyy')}
                            </NativeText>
                        </View>
                    </View>
                )}

                {/* How it Works Card */}
                <View style={[styles.card, { backgroundColor: theme.brandForest }]}>
                    <NativeView style={styles.rewardRow}>
                        <NativeView style={styles.rewardItem}>
                            <NativeText style={styles.rewardDays}>+15</NativeText>
                            <NativeText style={styles.rewardLabel}>Days</NativeText>
                            <NativeText style={styles.rewardSub}>3 Months</NativeText>
                        </NativeView>
                        <NativeView style={styles.divider} />
                        <NativeView style={styles.rewardItem}>
                            <NativeText style={styles.rewardDays}>+30</NativeText>
                            <NativeText style={styles.rewardLabel}>Days</NativeText>
                            <NativeText style={styles.rewardSub}>6 Months</NativeText>
                        </NativeView>
                        <NativeView style={styles.divider} />
                        <NativeView style={styles.rewardItem}>
                            <NativeText style={styles.rewardDays}>+45</NativeText>
                            <NativeText style={styles.rewardLabel}>Days</NativeText>
                            <NativeText style={styles.rewardSub}>9 Months</NativeText>
                        </NativeView>
                    </NativeView>
                    <NativeText style={styles.cardFooter}>Rewards added when your friend joins a plan!</NativeText>
                </View>

                {/* Referral Form */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Refer a Friend</Text>

                    <View style={styles.form}>
                        <View style={[styles.inputContainer, { borderColor: theme.brandSage + '40', backgroundColor: '#f8fafc' }]}>
                            <User size={20} color={theme.brandSage} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Friend's Name"
                                placeholderTextColor="#94a3b8"
                            />
                        </View>

                        <View style={[styles.inputContainer, { borderColor: theme.brandSage + '40', backgroundColor: '#f8fafc' }]}>
                            <Phone size={20} color={theme.brandSage} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="Friend's Mobile Number"
                                placeholderTextColor="#94a3b8"
                                keyboardType="phone-pad"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.brandForest }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <NativeView style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <UserPlus size={20} color="#FFF" />
                                    <NativeText style={styles.buttonText}>Submit Referral</NativeText>
                                </NativeView>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Referrals List */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Your Referrals</Text>

                    {referrals.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No referrals yet. Invite someone!</Text>
                        </View>
                    ) : (
                        <View style={styles.list}>
                            {referrals.map((item, index) => {
                                const reward = getRewardForReferral(item._id);
                                return (
                                    <View key={index} style={[styles.item, { borderBottomColor: '#f1f5f9', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <View>
                                                <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                                                <Text style={styles.itemSub}>{item.phone}</Text>
                                            </View>
                                            <StatusBadge status={item.status} referralStatus={item.referralStatus} />
                                        </View>

                                        {reward && subscription && (
                                            <NativeView style={[styles.rewardInfoBox, { backgroundColor: theme.brandForest + '10' }]}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                                    <Gift size={14} color={theme.brandForest} />
                                                    <NativeText style={[styles.rewardInfoTitle, { color: theme.brandForest }]}>
                                                        Referral Reward Applied
                                                    </NativeText>
                                                </View>

                                                <View style={styles.rewardDetailRow}>
                                                    <NativeText style={styles.rewardDetailLabel}>Days Added:</NativeText>
                                                    <NativeText style={[styles.rewardDetailValue, { color: theme.brandForest }]}>+{reward.daysEarned} Days</NativeText>
                                                </View>

                                                <View style={styles.rewardDetailRow}>
                                                    <NativeText style={styles.rewardDetailLabel}>Plan Valid Until:</NativeText>
                                                    <NativeText style={[styles.rewardDetailValue, { color: theme.brandForest }]}>
                                                        {format(new Date(subscription.endDate), 'MMM dd, yyyy')}
                                                    </NativeText>
                                                </View>
                                            </NativeView>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

                {/* Rewards History */}
                {rewards.length > 0 && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Rewards Earned</Text>
                        <View style={styles.list}>
                            {rewards.map((item, index) => (
                                <View key={index} style={[styles.item, { borderBottomColor: '#f1f5f9' }]}>
                                    <View>
                                        <Text style={[styles.itemName, { color: theme.text }]}>+{item.daysEarned} Days</Text>
                                        <Text style={styles.itemSub}>{new Date(item.date).toLocaleDateString()}</Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                                        <Gift size={12} color={theme.brandForest} />
                                        <Text style={[styles.badgeText, { color: theme.brandForest }]}>Applied</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: { padding: 24, paddingBottom: 10 },
    title: { fontSize: 28, fontWeight: '900' },
    subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
    scrollContent: { padding: 24, paddingTop: 10, paddingBottom: 40, gap: 24 },

    card: { borderRadius: 20, padding: 20, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    rewardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    rewardItem: { alignItems: 'center', flex: 1 },
    rewardDays: { fontSize: 24, fontWeight: '900', color: '#FFF' },
    rewardLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    rewardSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500' },
    divider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
    cardFooter: { color: 'rgba(255,255,255,0.9)', fontSize: 12, textAlign: 'center', fontWeight: '500', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },

    section: { gap: 12 },
    sectionTitle: { fontSize: 18, fontWeight: '700' },
    form: { gap: 12 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, gap: 12 },
    input: { flex: 1, fontSize: 16, fontWeight: '500' },
    button: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    list: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, gap: 16, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottomWidth: 1, marginBottom: -12 },
    itemName: { fontSize: 16, fontWeight: '600' },
    itemSub: { fontSize: 12, color: '#94a3b8' },

    badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4, borderWidth: 1 },
    badgeText: { fontSize: 10, fontWeight: '700' },

    rewardInfoBox: {
        width: '100%',
        padding: 12,
        borderRadius: 12,
        marginTop: 4,
    },
    rewardInfoTitle: {
        fontSize: 12,
        fontWeight: '700',
    },
    rewardDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    rewardDetailLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    rewardDetailValue: {
        fontSize: 12,
        fontWeight: '700',
    },

    emptyState: { padding: 20, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12 },
    emptyText: { color: '#94a3b8', fontStyle: 'italic' },

    expiryCard: {
        padding: 20,
        borderRadius: 24,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        width: '100%',
    },
    expiryIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    expiryContent: {
        flex: 1,
    },
    expiryLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 0, // removed margin
    },
    expiryDate: {
        fontSize: 16, // matched goalValue size
        fontWeight: '800',
    },
    rewardBadgeSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        backgroundColor: '#dcfce7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    rewardBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
});

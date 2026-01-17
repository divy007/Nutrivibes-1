import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Check, RotateCcw } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import { useRouter } from 'expo-router';

const PlanCard = ({ plan, highlight, width }: { plan: any, highlight: boolean, width: number }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    // Ensure features is an array, backend might return it differently or empty
    const features = Array.isArray(plan.features) ? plan.features : [];

    return (
        <View style={[
            styles.card,
            { width: width, backgroundColor: theme.background, borderColor: highlight ? theme.tint : '#eee', borderWidth: highlight ? 2 : 1 }
        ]}>
            <View style={[styles.header, { backgroundColor: '#fff' }]}>
                <Text style={[styles.headerText, { color: theme.brandForest }]}>{plan.name}</Text>

                {/* Price hidden as per requirement */}

                <Text style={[styles.headerSubText, { color: theme.brandEarth }]}>{plan.durationMonths} Months</Text>
                {highlight && <View style={[styles.badge, { backgroundColor: theme.brandForest }]}><Text style={styles.badgeText}>Recommended</Text></View>}
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1, padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                <View style={{ gap: 16 }}>
                    {features.length > 0 ? features.map((feature: string, index: number) => (
                        <View key={index} style={styles.featureRow}>
                            <Check size={20} color={theme.brandSage} />
                            <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                        </View>
                    )) : (
                        plan.description ? (
                            <View style={styles.featureRow}>
                                <Check size={20} color={theme.brandSage} />
                                <Text style={[styles.featureText, { color: theme.text }]}>{plan.description}</Text>
                            </View>
                        ) : null
                    )}
                </View>
            </ScrollView>

            <View style={[styles.stickyButtonContainer, { backgroundColor: theme.background }]}>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.brandEarth }]}
                    onPress={() => router.push('/contact')}
                >
                    <Text style={styles.buttonText}>Contact to Join</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function PlansScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setRefreshing(true);
            const data = await api.get('/api/plans');
            // Sort plans: Holistic Wellness first, then others
            const sortedPlans = (data as any[]).sort((a, b) => {
                const aName = a.name.toLowerCase();
                const bName = b.name.toLowerCase();

                if (aName.includes('holistic') && !bName.includes('holistic')) return -1;
                if (!aName.includes('holistic') && bName.includes('holistic')) return 1;

                if (aName.includes('wedding') && !bName.includes('wedding')) return 1;
                if (!aName.includes('wedding') && bName.includes('wedding')) return -1;

                return 0;
            });
            setPlans(sortedPlans);
        } catch (error) {
            console.error('Failed to load plans', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const { width } = Dimensions.get('window');
    const CARD_WIDTH = width * 0.85;
    const SPACING = 15;
    const SNAP_INTERVAL = CARD_WIDTH + SPACING;

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brandForest} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.staticHeader}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                    <Text style={[styles.title, { color: theme.brandForest }]}>Choose your plan</Text>
                    <Text style={[styles.subtitle, { color: theme.brandSage }]}>Diet & Lifestyle Management</Text>
                </View>
                <TouchableOpacity
                    onPress={fetchPlans}
                    disabled={refreshing}
                    style={{ padding: 8, backgroundColor: theme.brandSage + '20', borderRadius: 12 }}
                >
                    <RotateCcw size={20} color={theme.brandForest} style={{ opacity: refreshing ? 0.5 : 1 }} />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.carousel, { paddingHorizontal: (width - CARD_WIDTH) / 2 }]}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                snapToAlignment="center"
            >
                {plans.length > 0 ? plans.map((plan, index) => (
                    <View key={plan._id || index} style={[styles.cardWrapper, { width: CARD_WIDTH, marginRight: index === plans.length - 1 ? 0 : SPACING }]}>
                        <PlanCard plan={plan} highlight={plan.isRecommended} width={CARD_WIDTH} />
                    </View>
                )) : (
                    <View style={{ width: width - 40, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#666' }}>No active plans available.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    staticHeader: {
        paddingTop: 20,
        paddingBottom: 10,
        paddingHorizontal: 24,
        backgroundColor: 'transparent',
        zIndex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'left',
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'left',
        marginBottom: 10,
        fontWeight: '600',
    },
    carousel: {
        alignItems: 'center',
        paddingBottom: 40,
        paddingTop: 10,
    },
    cardWrapper: {
        height: '100%',
        justifyContent: 'center',
    },
    card: {
        borderRadius: 24,
        padding: 0,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        height: '96%', // Give some space for shadow
        marginBottom: 10,
    },
    header: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        borderStyle: 'dashed',
    },
    headerText: {
        fontSize: 20,
        fontWeight: '700',
        opacity: 0.9,
        textAlign: 'center',
    },
    headerSubText: {
        fontSize: 32,
        fontWeight: '900',
        marginTop: 8,
        letterSpacing: 1,
    },
    badge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    features: {
        padding: 24,
        gap: 16,
        flex: 1,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureText: {
        fontSize: 15,
        flex: 1,
        fontWeight: '600',
        lineHeight: 22,
    },
    stickyButtonContainer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    button: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
});

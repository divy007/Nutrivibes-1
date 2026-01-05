import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Check } from 'lucide-react-native';

const PlanCard = ({ plan, highlight, width }: { plan: any, highlight: boolean, width: number }) => {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={[
            styles.card,
            { width: width, backgroundColor: theme.background, borderColor: highlight ? theme.tint : '#eee', borderWidth: highlight ? 2 : 1 }
        ]}>
            <View style={[styles.header, { backgroundColor: '#fff' }]}>
                <Text style={[styles.headerText, { color: theme.brandEarth }]}>{plan.title}</Text>
                <Text style={[styles.headerSubText, { color: theme.brandEarth }]}>{plan.duration}</Text>
                {highlight && <View style={[styles.badge, { backgroundColor: theme.brandForest }]}><Text style={styles.badgeText}>Recommended</Text></View>}
            </View>

            <View style={styles.features}>
                {plan.features.map((feature: string, index: number) => (
                    <View key={index} style={styles.featureRow}>
                        <Check size={20} color={theme.brandSage} />
                        <Text style={[styles.featureText, { color: theme.text }]}>{feature}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity style={[styles.button, { backgroundColor: theme.brandClay }]}>
                <Text style={styles.buttonText}>Call</Text>
            </TouchableOpacity>
        </View>
    );
};

export default function PlansScreen() {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const plans = [
        {
            title: 'Cure & Reverse',
            duration: '3 Months',
            features: [
                '3 Month Validity',
                'Dedicated Clinical Nutritionist',
                '12 Dietitian Counsellings',
                'Dedicated customer support',
            ]
        },
        {
            title: 'Cure & Reverse',
            duration: '6 Months',
            features: [
                '6 Month Validity',
                'Dedicated Clinical Nutritionist',
                '24 Dietitian Counsellings',
                '15 Pause Days',
            ]
        },
        {
            title: 'Cure & Reverse',
            duration: '9 Months',
            features: [
                '9 Month Validity',
                'Dedicated Clinical Nutritionist',
                '36 Dietitian Counsellings',
                '30 Pause Days',
                'Exclusive care for hair and skin',
            ]
        },
        {
            title: 'Cure & Reverse',
            duration: '12 Months',
            features: [
                '12 Month Validity',
                'Dedicated Clinical Nutritionist',
                '48 Dietitian Counsellings',
                '45 Pause Days',
                'Exclusive care for hair and skin',
            ]
        },
        // Wedding Plans
        {
            title: 'Wedding Glow',
            duration: '3 Months',
            features: [
                '3 Month Validity',
                'Dedicated Diet Coach',
                'Metabolism Boosting + Correction',
                'Maintenance & Detox Plan',
                'Skin & Hair Diets (Biotin & Keratin Rich)',
                'Collagen Boosting & Anti-Oxidant Rich Diets',
                'Improve Skin glow'
            ]
        },
        {
            title: 'Wedding Glow',
            duration: '6 Months',
            features: [
                '6 Month Validity',
                'Dedicated Diet Coach',
                'Metabolism Boosting + Correction',
                'Maintenance & Detox Plan for Parties',
                'Skin & Hair Diets (Biotin & Keratin Rich)',
                'Collagen Boosting & Anti-Oxidant Rich Diets',
                'Improve Skin glow'
            ]
        }
    ];

    const { width } = Dimensions.get('window');
    const CARD_WIDTH = width * 0.85;
    const SPACING = 15;
    const SNAP_INTERVAL = CARD_WIDTH + SPACING;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.staticHeader}>
                <Text style={[styles.title, { color: theme.brandForest }]}>Choose your plan</Text>
                <Text style={[styles.subtitle, { color: theme.brandSage }]}>Diet & Lifestyle Management</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.carousel, { paddingHorizontal: (width - CARD_WIDTH) / 2 }]}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                snapToAlignment="center"
            >
                {plans.map((plan, index) => (
                    <View key={index} style={[styles.cardWrapper, { width: CARD_WIDTH, marginRight: index === plans.length - 1 ? 0 : SPACING }]}>
                        <PlanCard plan={plan} highlight={index === 1} width={CARD_WIDTH} />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    staticHeader: {
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
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
    button: {
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginBottom: 24,
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

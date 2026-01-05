import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, ChevronRight, Info, Activity, Clock } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CycleStatus {
    phase: 'PERIOD' | 'FOLLICULAR' | 'OVULATION' | 'LUTEAL';
    dayOfCycle: number;
    daysUntilNextPeriod: number;
    phaseInfo: {
        title: string;
        description: string;
        nutritionTip: string;
    };
}

interface Props {
    status: CycleStatus | null;
    onLogPress: () => void;
}

export const CycleTrackerCard = ({ status, onLogPress }: Props) => {
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];

    if (!status) {
        return (
            <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
                <View style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '10' }]}>
                        <Calendar size={20} color={theme.brandSage} />
                    </View>
                    <Text style={[styles.label, { color: theme.brandForest }]}>Cycle Tracker</Text>
                </View>

                <View style={styles.emptyStateContent}>
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No Data Yet</Text>
                    <Text style={styles.emptySubtitle}>Track your cycle to get insights and tips tailored to your body.</Text>
                </View>

                <TouchableOpacity
                    style={[styles.updateButton, { backgroundColor: theme.brandSage }]}
                    onPress={onLogPress}
                >
                    <Text style={styles.updateButtonText}>Log Period</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const phaseColors: Record<string, string> = {
        PERIOD: '#f43f5e', // Rose
        FOLLICULAR: '#0ea5e9', // Sky
        OVULATION: '#8b5cf6', // Violet
        LUTEAL: '#f59e0b', // Amber
    };

    const currentPhaseColor = phaseColors[status.phase] || theme.brandSage;

    return (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: currentPhaseColor + '15' }]}>
                    <Calendar size={20} color={currentPhaseColor} />
                </View>
                <Text style={[styles.label, { color: theme.brandForest }]}>Cycle Tracker</Text>
            </View>

            {/* Main Content: Day X & Phase */}
            <View style={styles.mainContent}>
                <View>
                    <Text style={[styles.dayValue, { color: theme.text }]}>Day {status.dayOfCycle}</Text>
                    <Text style={[styles.phaseName, { color: currentPhaseColor }]}>{status.phaseInfo.title}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: currentPhaseColor + '15' }]}>
                    <Clock size={14} color={currentPhaseColor} />
                    <Text style={[styles.badgeText, { color: currentPhaseColor }]}>
                        {status.daysUntilNextPeriod} days left
                    </Text>
                </View>
            </View>

            {/* Content/Tip Section */}
            <View style={styles.infoContainer}>
                <View style={styles.tipHeader}>
                    <Info size={14} color={theme.brandForest} />
                    <Text style={[styles.tipTitle, { color: theme.brandForest }]}>Nutrition Tip</Text>
                </View>
                <Text style={[styles.tipText, { color: theme.text }]}>{status.phaseInfo.nutritionTip}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.brandSage + '10' }]} />

            {/* Footer with Description */}
            <View style={styles.footer}>
                <Text style={styles.description}>{status.phaseInfo.description}</Text>
            </View>

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.brandSage }]}
                onPress={onLogPress}
            >
                <Text style={styles.updateButtonText}>Log Period</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    mainContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    dayValue: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -1,
        lineHeight: 42,
    },
    phaseName: {
        fontSize: 14,
        fontWeight: '800',
        marginTop: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '800',
    },
    infoContainer: {
        backgroundColor: 'rgba(0,0,0,0.02)',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tipTitle: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tipText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 16,
    },
    footer: {
        marginBottom: 8,
    },
    description: {
        fontSize: 13,
        color: '#94a3b8',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    updateButton: {
        marginTop: 12,
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    updateButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    emptyStateContent: {
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 20,
    }
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Calendar, ChevronRight, Info } from 'lucide-react-native';
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
            <TouchableOpacity
                style={[styles.container, { backgroundColor: theme.cardBackground }]}
                onPress={onLogPress}
            >
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Heart size={20} color={theme.brandForest} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: theme.brandForest }]}>Women's Health</Text>
                        <Text style={styles.subtitle}>Track your cycle for better insights</Text>
                    </View>
                    <ChevronRight size={20} color="#64748b" />
                </View>
            </TouchableOpacity>
        );
    }

    const phaseColors: Record<string, string> = {
        PERIOD: '#f43f5e', // Rose
        FOLLICULAR: '#0ea5e9', // Sky
        OVULATION: '#8b5cf6', // Violet
        LUTEAL: '#f59e0b', // Amber
    };

    const currentPhaseColor = phaseColors[status.phase] || theme.brandForest;

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${currentPhaseColor}15` }]}>
                    <Calendar size={20} color={currentPhaseColor} />
                </View>
                <View style={styles.headerText}>
                    <View style={styles.phaseBadgeRow}>
                        <Text style={[styles.title, { color: theme.brandForest }]}>{status.phaseInfo.title}</Text>
                        <View style={[styles.badge, { backgroundColor: `${currentPhaseColor}20` }]}>
                            <Text style={[styles.badgeText, { color: currentPhaseColor }]}>Day {status.dayOfCycle}</Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle}>{status.daysUntilNextPeriod} days until next cycle</Text>
                </View>
                <TouchableOpacity onPress={onLogPress}>
                    <Text style={[styles.logButton, { color: theme.brandForest }]}>Log</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.tipCard, { backgroundColor: theme.background }]}>
                <View style={styles.tipHeader}>
                    <Info size={14} color={theme.brandForest} />
                    <Text style={[styles.tipTitle, { color: theme.brandForest }]}>Nutrition Tip</Text>
                </View>
                <Text style={styles.tipText}>{status.phaseInfo.nutritionTip}</Text>
            </View>

            <Text style={styles.description}>{status.phaseInfo.description}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        flex: 1,
    },
    phaseBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    logButton: {
        fontSize: 14,
        fontWeight: '700',
    },
    tipCard: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        gap: 4,
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
    },
    tipText: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        fontWeight: '500',
    },
    description: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 12,
        fontStyle: 'italic',
    },
});

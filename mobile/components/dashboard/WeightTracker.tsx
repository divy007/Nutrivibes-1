import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Scale, TrendingDown, Target } from 'lucide-react-native';

interface WeightTrackerProps {
    currentWeight: number;
    startWeight: number;
    idealWeight: number;
    onPress: () => void;
}

export default function WeightTracker({ currentWeight, startWeight, idealWeight, onPress }: WeightTrackerProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const progress = startWeight === idealWeight ? 100 : Math.max(0, Math.min(100,
        ((startWeight - currentWeight) / (startWeight - idealWeight)) * 100
    ));

    return (
        <View
            style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}
        >
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '10' }]}>
                    <Scale size={20} color={theme.brandSage} />
                </View>
                <Text style={[styles.label, { color: theme.brandForest }]}>Weight Tracker</Text>
            </View>

            <View style={styles.mainContent}>
                <View>
                    <Text style={[styles.weightValue, { color: theme.text }]}>{currentWeight.toFixed(1)}</Text>
                    <Text style={styles.unit}>kg</Text>
                </View>
                <View style={styles.badge}>
                    <TrendingDown size={14} color="#10b981" />
                    <Text style={styles.badgeText}>-{Math.abs(startWeight - currentWeight).toFixed(1)} kg</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress to Ideal</Text>
                    <Text style={[styles.progressValue, { color: theme.brandSage }]}>{progress.toFixed(0)}%</Text>
                </View>
                <View style={[styles.progressBarBase, { backgroundColor: theme.brandSage + '10' }]}>
                    <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: theme.brandSage }]} />
                </View>
                <View style={styles.footer}>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>Start</Text>
                        <Text style={styles.footerValue}>{startWeight}kg</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Text style={styles.footerLabel}>Target</Text>
                        <Text style={[styles.footerValue, { color: theme.brandEarth }]}>{idealWeight}kg</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.updateButton, { backgroundColor: theme.brandSage }]}
                    onPress={onPress}
                >
                    <Text style={styles.updateButtonText}>Update Weight</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

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
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    weightValue: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -1,
    },
    unit: {
        fontSize: 16,
        fontWeight: '700',
        color: '#94a3b8',
        marginLeft: 4,
        marginBottom: 8,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    badgeText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '800',
    },
    progressContainer: {
        gap: 10,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '900',
    },
    progressBarBase: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    footerItem: {
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    footerValue: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1e293b',
    },
    updateButton: {
        marginTop: 20,
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
});

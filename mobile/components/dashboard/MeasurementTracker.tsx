import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Ruler, Calendar, Plus } from 'lucide-react-native';
import { format } from 'date-fns';

interface MeasurementLog {
    _id: string;
    date: string;
    chest: number;
    arms: number;
    waist: number;
    hips: number;
    thigh: number;
    unit: string;
}

interface MeasurementTrackerProps {
    logs: MeasurementLog[];
    onUpdateClick: () => void;
}

const COLORS = {
    chest: '#A3D139',
    arms: '#FF7F50',
    waist: '#8DE1D9',
    hips: '#FFB84D',
    thigh: '#9B9BFF',
};

export default function MeasurementTracker({ logs, onUpdateClick }: MeasurementTrackerProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const latestLog = logs[0] || null;

    const renderBar = (label: string, value: number, color: string) => {
        // Assume max 120 for visualization scale
        const height = (value / 120) * 120;
        return (
            <View key={label} style={styles.barContainer}>
                <View style={[styles.barBase, { backgroundColor: theme.brandSage + '08' }]}>
                    <View style={[styles.barFill, { height, backgroundColor: color }]} />
                </View>
                <Text style={styles.barLabel}>{label[0]}</Text>
            </View>
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '10' }]}>
                        <Ruler size={20} color={theme.brandSage} />
                    </View>
                    <Text style={[styles.label, { color: theme.brandForest }]}>Measurements</Text>
                </View>
                <TouchableOpacity style={styles.calendarButton}>
                    <Calendar size={18} color="#94a3b8" />
                </TouchableOpacity>
            </View>

            <View style={[styles.chartArea, { backgroundColor: theme.brandSage + '03' }]}>
                {latestLog ? (
                    <View style={styles.chart}>
                        {renderBar('Chest', latestLog.chest, COLORS.chest)}
                        {renderBar('Arms', latestLog.arms, COLORS.arms)}
                        {renderBar('Waist', latestLog.waist, COLORS.waist)}
                        {renderBar('Hips', latestLog.hips, COLORS.hips)}
                        {renderBar('Thigh', latestLog.thigh, COLORS.thigh)}
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No measurements logged yet</Text>
                )}
                {latestLog && (
                    <Text style={styles.chartDate}>
                        {format(new Date(latestLog.date), 'eee')}
                    </Text>
                )}
            </View>

            <View style={styles.legend}>
                {Object.entries(COLORS).map(([key, color]) => (
                    <View key={key} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: color }]} />
                        <Text style={styles.legendText}>{key}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.brandSage }]}
                onPress={onUpdateClick}
            >
                <Plus size={18} color="#FFF" />
                <Text style={styles.updateButtonText}>Update Measurement</Text>
            </TouchableOpacity>
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
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    calendarButton: {
        padding: 8,
    },
    chartArea: {
        height: 180,
        borderRadius: 24,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 16,
        height: '100%',
    },
    barContainer: {
        alignItems: 'center',
        gap: 8,
    },
    barBase: {
        width: 12,
        height: 120,
        borderRadius: 6,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    barFill: {
        width: '100%',
        borderRadius: 6,
    },
    barLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
    },
    emptyText: {
        fontSize: 13,
        fontStyle: 'italic',
        color: '#94a3b8',
        fontWeight: '500',
    },
    chartDate: {
        position: 'absolute',
        bottom: 8,
        fontSize: 10,
        fontWeight: '800',
        color: '#cbd5e1',
        textTransform: 'uppercase',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 24,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'capitalize',
    },
    updateButton: {
        height: 54,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
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

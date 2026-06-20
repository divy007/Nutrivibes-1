import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Footprints, Plus } from 'lucide-react-native';

interface StepsTrackerProps {
    steps: number;
    targetSteps: number;
    onPressLog: () => void;
}

const StepsTracker = React.memo(function StepsTracker({ steps, targetSteps, onPressLog }: StepsTrackerProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const percentage = Math.min(100, Math.round((steps / targetSteps) * 100));

    return (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '15' }]}>
                    <Footprints size={20} color={theme.brandSage} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.label, { color: theme.brandForest }]}>Daily Steps</Text>
                    <Text style={styles.subtitle}>
                        {steps.toLocaleString()} / {targetSteps.toLocaleString()} steps
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.logButton, { backgroundColor: theme.brandSage, shadowColor: theme.brandSage }]}
                    onPress={onPressLog}
                    activeOpacity={0.8}
                >
                    <Plus size={20} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
                <View style={[styles.progressBarTrack, { backgroundColor: theme.brandSage + '10' }]}>
                    <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: theme.brandSage }]} />
                </View>
                <View style={styles.footerRow}>
                    <Text style={styles.percentText}>{percentage}% Completed</Text>
                    <Text style={styles.stepsRemaining}>
                        {steps >= targetSteps ? 'Goal reached! 🎉' : `${(targetSteps - steps).toLocaleString()} steps left`}
                    </Text>
                </View>
            </View>
        </View>
    );
});

export default StepsTracker;

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
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    textContainer: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    label: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2,
    },
    logButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    progressContainer: {
        marginTop: 20,
        backgroundColor: 'transparent',
    },
    progressBarTrack: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        backgroundColor: 'transparent',
    },
    percentText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    stepsRemaining: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
});

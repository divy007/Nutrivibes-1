import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Droplet, Plus } from 'lucide-react-native';

interface WaterTrackerProps {
    currentGlasses: number;
    targetGlasses: number;
    onAdd: () => void;
}

export default function WaterTracker({ currentGlasses, targetGlasses, onAdd }: WaterTrackerProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    return (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: '#e0f2fe' }]}>
                    <Droplet size={20} color="#0ea5e9" />
                </View>
                <View>
                    <Text style={[styles.label, { color: theme.brandForest }]}>Water Intake</Text>
                    <Text style={styles.subtitle}>{currentGlasses * 250}ml / {targetGlasses * 250}ml</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: '#0ea5e9' }]}
                    onPress={onAdd}
                    activeOpacity={0.7}
                >
                    <Plus size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                {Array.from({ length: targetGlasses }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.glass,
                            {
                                borderColor: i < currentGlasses ? '#0ea5e9' : '#e2e8f0',
                                backgroundColor: i < currentGlasses ? '#e0f2fe' : 'transparent'
                            }
                        ]}
                    >
                        <Droplet
                            size={12}
                            color={i < currentGlasses ? '#0ea5e9' : '#cbd5e1'}
                            fill={i < currentGlasses ? '#0ea5e9' : 'transparent'}
                        />
                    </View>
                ))}
            </View>

            <Text style={styles.footerNote}>
                Current: {currentGlasses} / {targetGlasses} glasses
            </Text>
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
    subtitle: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    addButton: {
        marginLeft: 'auto',
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#0ea5e9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 16,
    },
    glass: {
        width: 32,
        height: 32,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footerNote: {
        fontSize: 11,
        fontStyle: 'italic',
        color: '#94a3b8',
        textAlign: 'center',
    }
});

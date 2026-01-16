import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Smile, Frown, Meh, AlertCircle, Zap, Ghost, HeartPulse } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface Symptom {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const SYMPTOMS: Symptom[] = [
    { id: 'acidity', label: 'Acidity', icon: <Zap size={18} /> },
    { id: 'bloating', label: 'Bloating', icon: <Ghost size={18} /> },
    { id: 'low_energy', label: 'Low Energy', icon: <Frown size={18} /> },
    { id: 'stomach_pain', label: 'Stomach Pain', icon: <AlertCircle size={18} /> },
    { id: 'feeling_great', label: 'Feeling Great', icon: <Smile size={18} /> },
];

interface Props {
    onSave: (symptoms: string[], energyLevel: number) => void;
    isSaving?: boolean;
}

export const SymptomCheckIn = ({ onSave, isSaving }: Props) => {
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [energyLevel, setEnergyLevel] = useState(3);

    const toggleSymptom = (id: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '10' }]}>
                    <HeartPulse size={20} color={theme.brandSage} />
                </View>
                <Text style={[styles.label, { color: theme.brandForest }]}>Daily Check-in</Text>
            </View>

            <View style={styles.symptomGrid}>
                {SYMPTOMS.map(symptom => {
                    const isSelected = selectedSymptoms.includes(symptom.id);
                    return (
                        <TouchableOpacity
                            key={symptom.id}
                            style={[
                                styles.symptomButton,
                                { backgroundColor: isSelected ? theme.brandSage : theme.background, borderColor: isSelected ? theme.brandSage : theme.brandSage + '20' },
                                isSelected && styles.selectedButton
                            ]}
                            onPress={() => toggleSymptom(symptom.id)}
                        >
                            <View>
                                {React.cloneElement(symptom.icon as any, {
                                    color: isSelected ? '#fff' : '#64748b'
                                })}
                            </View>
                            <Text style={[
                                styles.symptomLabel,
                                { color: isSelected ? '#fff' : '#64748b' }
                            ]}>
                                {symptom.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.energySection}>
                <Text style={styles.sectionLabel}>Energy Level: {energyLevel}/5</Text>
                <View style={styles.energyGrid}>
                    {[1, 2, 3, 4, 5].map(level => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.energyButton,
                                {
                                    backgroundColor: energyLevel === level ? theme.brandForest : theme.background,
                                    borderColor: energyLevel === level ? theme.brandForest : theme.brandSage + '20'
                                }
                            ]}
                            onPress={() => setEnergyLevel(level)}
                        >
                            <Text style={{
                                color: energyLevel === level ? '#fff' : theme.text,
                                fontWeight: '700'
                            }}>
                                {level}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: theme.brandSage }]}
                onPress={() => onSave(selectedSymptoms, energyLevel)}
                disabled={isSaving}
            >
                <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Log Wellbeing'}
                </Text>
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
    symptomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    symptomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        gap: 8,
        borderWidth: 1,
    },
    selectedButton: {
        borderColor: 'transparent',
    },
    symptomLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    energySection: {
        marginBottom: 24,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    energyGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    energyButton: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    saveButton: {
        height: 54,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Smile, Frown, Meh, AlertCircle, Zap, Ghost } from 'lucide-react-native';
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
        <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.title, { color: theme.brandForest }]}>How are you feeling today?</Text>

            <View style={styles.symptomGrid}>
                {SYMPTOMS.map(symptom => {
                    const isSelected = selectedSymptoms.includes(symptom.id);
                    return (
                        <TouchableOpacity
                            key={symptom.id}
                            style={[
                                styles.symptomButton,
                                { backgroundColor: isSelected ? theme.brandSage : theme.background },
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
                <Text style={styles.label}>Energy Level: {energyLevel}/5</Text>
                <View style={styles.energyGrid}>
                    {[1, 2, 3, 4, 5].map(level => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.energyButton,
                                { backgroundColor: energyLevel === level ? theme.brandForest : theme.background }
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
                style={[styles.saveButton, { backgroundColor: theme.brandForest }]}
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
    title: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    symptomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    symptomButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedButton: {
        borderColor: 'rgba(255,255,255,0.2)',
    },
    symptomLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    energySection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748b',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    energyGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    energyButton: {
        flex: 1,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },
});

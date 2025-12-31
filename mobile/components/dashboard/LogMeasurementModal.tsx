import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, View, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text } from '@/components/Themed';
import { X, Minus, Plus, Ruler, Circle, Layers, Columns, Users, Shirt } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LogMeasurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (measurements: any, unit: string, date: Date) => Promise<void>;
    initialValues?: {
        chest: number;
        arms: number;
        waist: number;
        hips: number;
        thigh: number;
    };
}

const MEASUREMENT_TYPES = [
    { key: 'chest', label: 'Chest', icon: Shirt },
    { key: 'arms', label: 'Arms', icon: Ruler },
    { key: 'waist', label: 'Waist', icon: Circle },
    { key: 'hips', label: 'Hips', icon: Layers },
    { key: 'thigh', label: 'Thigh', icon: Columns },
];

export default function LogMeasurementModal({ isOpen, onClose, onSave, initialValues }: LogMeasurementModalProps) {
    const [values, setValues] = useState<any>({
        chest: initialValues?.chest || 36.5,
        arms: initialValues?.arms || 12.5,
        waist: initialValues?.waist || 32.5,
        hips: initialValues?.hips || 37.5,
        thigh: initialValues?.thigh || 21.5,
    });
    const [unit, setUnit] = useState('inch'); // Default to inch as per UI
    const [isSaving, setIsSaving] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleIncrement = (key: string) => {
        setValues((prev: any) => ({
            ...prev,
            [key]: parseFloat((parseFloat(prev[key] || 0) + 0.5).toFixed(1))
        }));
    };

    const handleDecrement = (key: string) => {
        setValues((prev: any) => ({
            ...prev,
            [key]: Math.max(0, parseFloat((parseFloat(prev[key] || 0) - 0.5).toFixed(1)))
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(values, unit, new Date());
            onClose();
        } catch (error) {
            console.error('Failed to save measurements:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const renderStepper = (item: any) => {
        const Icon = item.icon;
        const value = values[item.key] || 0;

        return (
            <View key={item.key} style={styles.stepperRow}>
                {/* Available Icon */}
                <View style={[styles.iconContainer, { backgroundColor: '#F8F9FA' }]}>
                    <Icon size={24} color={theme.brandForest} strokeWidth={1.5} />
                    <Text style={[styles.iconLabel, { color: theme.brandForest }]}>{item.label}</Text>
                </View>

                {/* Stepper Controls */}
                <View style={styles.stepperControls}>
                    <TouchableOpacity
                        style={[styles.stepperButton, { backgroundColor: '#E2E8F0' }]}
                        onPress={() => handleDecrement(item.key)}
                    >
                        <Minus size={20} color="#64748b" strokeWidth={3} />
                    </TouchableOpacity>

                    <View style={styles.valueContainer}>
                        <Text style={[styles.valueText, { color: theme.brandForest }]}>{value}</Text>
                        <Text style={styles.unitText}>{unit}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.stepperButton, { backgroundColor: '#F97316' }]} // Orange color from design
                        onPress={() => handleIncrement(item.key)}
                    >
                        <Plus size={20} color="#FFF" strokeWidth={3} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
                    <View style={[styles.content, { backgroundColor: theme.background }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} color="#64748b" />
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: theme.text }]}>Measurement Tracker</Text>
                            <View style={{ width: 24 }} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                            <View style={styles.listContainer}>
                                {MEASUREMENT_TYPES.map(renderStepper)}
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: '#F97316' }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Done</Text>}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.4)' }, // Lighter backdrop
    modalContainer: { width: '100%', height: '85%' }, // Taller modal
    content: {
        flex: 1,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32
    },
    title: { fontSize: 20, fontWeight: '800' },
    scrollBody: { paddingBottom: 40 },
    listContainer: { gap: 24, marginBottom: 32 },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 8, // Clean padding
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        gap: 4,
    },
    iconLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    stepperControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    stepperButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    valueContainer: {
        alignItems: 'center',
        minWidth: 80,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 4,
    },
    valueText: {
        fontSize: 28,
        fontWeight: '900',
    },
    unitText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#F97316', // Orange
        position: 'absolute',
        right: -30,
        bottom: 8,
    },
    saveButton: {
        width: '100%',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});

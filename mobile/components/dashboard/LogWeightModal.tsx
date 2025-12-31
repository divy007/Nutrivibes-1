import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X } from 'lucide-react-native';
import { format } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LogWeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (weight: number, unit: 'kg' | 'lb', date: Date) => Promise<void>;
    initialWeight?: number;
}

export default function LogWeightModal({ isOpen, onClose, onSave, initialWeight }: LogWeightModalProps) {
    const [weight, setWeight] = useState(initialWeight?.toString() || '');
    const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
    const [isSaving, setIsSaving] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleSave = async () => {
        if (!weight || isNaN(parseFloat(weight))) return;
        setIsSaving(true);
        try {
            await onSave(parseFloat(weight), unit, new Date());
            onClose();
        } catch (error) {
            console.error('Failed to save weight:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            visible={isOpen}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalContainer}
                >
                    <View style={[styles.content, { backgroundColor: theme.background }]}>
                        <View style={styles.header}>
                            <TouchableOpacity
                                onPress={onClose}
                                style={[styles.closeButton, { backgroundColor: '#f1f5f9' }]}
                            >
                                <X size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.body}>
                            <Text style={[styles.title, { color: theme.text }]}>Log weight</Text>

                            <View style={[styles.inputCard, { backgroundColor: theme.brandSage + '05', borderColor: theme.brandSage + '10' }]}>
                                <View style={styles.dateBadge}>
                                    <Text style={styles.dateText}>{format(new Date(), 'dd MMMM yyyy')}</Text>
                                </View>

                                <Text style={styles.inputLabel}>Enter Current Weight</Text>

                                <View style={styles.unitToggle}>
                                    <TouchableOpacity
                                        onPress={() => setUnit('kg')}
                                        style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
                                    >
                                        <Text style={[styles.unitButtonText, unit === 'kg' && styles.unitButtonTextActive]}>KG</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setUnit('lb')}
                                        style={[styles.unitButton, unit === 'lb' && styles.unitButtonActive]}
                                    >
                                        <Text style={[styles.unitButtonText, unit === 'lb' && styles.unitButtonTextActive]}>LB</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.weightInputContainer}>
                                    <TextInput
                                        style={[styles.input, { color: theme.brandForest }]}
                                        keyboardType="decimal-pad"
                                        value={weight}
                                        onChangeText={setWeight}
                                        placeholder="0.0"
                                        placeholderTextColor="#cbd5e1"
                                        autoFocus
                                    />
                                    <Text style={styles.unitSuffix}>{unit.toUpperCase()}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: weight ? theme.brandSage : '#e2e8f0' }]}
                                onPress={handleSave}
                                disabled={!weight || isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>DONE</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
    },
    modalContainer: {
        width: '100%',
    },
    content: {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 24,
    },
    inputCard: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 32,
    },
    dateBadge: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 20,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94a3b8',
    },
    inputLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 20,
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
        width: 140,
    },
    unitButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 16,
    },
    unitButtonActive: {
        backgroundColor: '#FEF9F3',
    },
    unitButtonText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    unitButtonTextActive: {
        color: '#C79A63',
    },
    weightInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#f1f5f9',
        width: 140,
        paddingBottom: 8,
    },
    input: {
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        padding: 0,
    },
    unitSuffix: {
        fontSize: 12,
        fontWeight: '900',
        color: '#C79A63',
        marginLeft: 4,
        marginBottom: 6,
    },
    saveButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

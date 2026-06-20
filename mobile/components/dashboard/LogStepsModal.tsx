import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X } from 'lucide-react-native';
import { format } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LogStepsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (steps: number, targetSteps?: number, date?: Date) => Promise<void>;
    initialSteps?: number;
    initialTarget?: number;
}

export default function LogStepsModal({ isOpen, onClose, onSave, initialSteps, initialTarget }: LogStepsModalProps) {
    const [steps, setSteps] = useState(initialSteps?.toString() || '0');
    const [isSaving, setIsSaving] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleSave = async () => {
        const parsed = parseInt(steps, 10);
        if (isNaN(parsed) || parsed < 0) return;
        setIsSaving(true);
        try {
            await onSave(parsed, initialTarget, new Date());
            onClose();
        } catch (error) {
            console.error('Failed to save steps:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuickAdd = (increment: number) => {
        const current = parseInt(steps, 10) || 0;
        setSteps(Math.max(0, current + increment).toString());
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
                    behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
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

                        <ScrollView
                            contentContainerStyle={styles.scrollBody}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.body}>
                                <Text style={[styles.title, { color: theme.text }]}>Log Steps</Text>

                                <View style={[styles.inputCard, { backgroundColor: theme.brandSage + '05', borderColor: theme.brandSage + '10' }]}>
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateText}>{format(new Date(), 'dd MMMM yyyy')}</Text>
                                    </View>

                                    <Text style={styles.inputLabel}>Enter Today's Steps</Text>

                                    <View style={styles.stepsInputContainer}>
                                        <TextInput
                                            style={[styles.input, { color: theme.brandForest }]}
                                            keyboardType="number-pad"
                                            value={steps}
                                            onChangeText={setSteps}
                                            placeholder="0"
                                            placeholderTextColor="#cbd5e1"
                                            autoFocus
                                        />
                                    </View>

                                    <View style={styles.quickAddContainer}>
                                        <TouchableOpacity
                                            style={[styles.quickAddButton, { borderColor: theme.brandSage }]}
                                            onPress={() => handleQuickAdd(1000)}
                                        >
                                            <Text style={[styles.quickAddText, { color: theme.brandSage }]}>+1,000</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.quickAddButton, { borderColor: theme.brandSage }]}
                                            onPress={() => handleQuickAdd(5000)}
                                        >
                                            <Text style={[styles.quickAddText, { color: theme.brandSage }]}>+5,000</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.quickAddButton, { borderColor: '#ef4444' }]}
                                            onPress={() => setSteps('0')}
                                        >
                                            <Text style={[styles.quickAddText, { color: '#ef4444' }]}>Reset</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={[styles.saveButton, { backgroundColor: theme.brandSage }]}
                                    onPress={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>DONE</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
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
    stepsInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#f1f5f9',
        width: 180,
        paddingBottom: 8,
        marginBottom: 24,
    },
    input: {
        fontSize: 36,
        fontWeight: '900',
        textAlign: 'center',
        padding: 0,
        flex: 1,
    },
    quickAddContainer: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
        width: '100%',
        backgroundColor: 'transparent',
    },
    quickAddButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1.5,
        backgroundColor: '#FFF',
    },
    quickAddText: {
        fontSize: 12,
        fontWeight: '800',
    },
    saveButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
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
    scrollBody: {
        paddingBottom: 20,
    },
});

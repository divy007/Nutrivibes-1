import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X, Settings } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CycleSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (length: number) => Promise<void>;
    initialLength?: number;
}

export default function CycleSettingsModal({ isOpen, onClose, onSave, initialLength = 28 }: CycleSettingsModalProps) {
    const [length, setLength] = useState(initialLength.toString());
    const [isSaving, setIsSaving] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        if (isOpen) {
            setLength(initialLength.toString());
        }
    }, [isOpen, initialLength]);

    const handleSave = async () => {
        const val = parseInt(length);
        if (isNaN(val) || val < 21 || val > 35) {
            alert('Please enter a valid cycle length (21-35 days)');
            return;
        }

        setIsSaving(true);
        try {
            await onSave(val);
            onClose();
        } catch (error) {
            console.error('Failed to save cycle settings:', error);
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
                    style={styles.keyboardView}
                >
                    <View style={[styles.content, { backgroundColor: theme.background }]}>
                        <View style={styles.header}>
                            <View style={styles.titleRow}>
                                <Settings size={20} color={theme.brandForest} />
                                <Text style={styles.title}>Cycle Settings</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.body}>
                            <Text style={styles.label}>Average Cycle Length (Days)</Text>
                            <Text style={styles.helperText}>
                                The number of days from the start of one period to the start of the next. Standard is 28 days.
                            </Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={length}
                                    onChangeText={setLength}
                                    keyboardType="number-pad"
                                    maxLength={2}
                                />
                                <Text style={styles.unitText}>Days</Text>
                            </View>

                            <TouchableOpacity
                                style={[styles.saveButton, { backgroundColor: theme.brandSage }]}
                                onPress={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Update Settings</Text>
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
    keyboardView: {
        width: '100%',
    },
    content: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
    },
    closeButton: {
        padding: 4,
    },
    body: {
        gap: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#475569',
    },
    helperText: {
        fontSize: 14,
        color: '#94a3b8',
        lineHeight: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        paddingHorizontal: 20,
        height: 60,
        marginBottom: 8,
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
    },
    unitText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#94a3b8',
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X, Calendar as CalendarIcon, Droplets } from 'lucide-react-native';
import { format } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface LogPeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (startDate: Date, endDate?: Date, intensity?: string) => Promise<void>;
    lastPeriodLog?: any;
}

export default function LogPeriodModal({ isOpen, onClose, onSave, lastPeriodLog }: LogPeriodModalProps) {
    const [intensity, setIntensity] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
    const [isSaving, setIsSaving] = useState(false);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];

    // Check if there's an active period (started and no end date)
    const hasActivePeriod = lastPeriodLog && !lastPeriodLog.endDate;

    useEffect(() => {
        if (isOpen) {
            if (lastPeriodLog && !lastPeriodLog.endDate) {
                setStartDate(new Date(lastPeriodLog.startDate));
                setEndDate(new Date());
            } else {
                setStartDate(new Date());
                setEndDate(new Date());
            }
            setShowStartDatePicker(false);
            setShowEndDatePicker(false);
        }
    }, [isOpen, lastPeriodLog]);

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const handleSave = async () => {
        if (hasActivePeriod && endDate < startDate) {
            Alert.alert('Invalid Date', 'End date cannot be before the start date.');
            return;
        }
        setIsSaving(true);
        try {
            if (hasActivePeriod) {
                // Ending active period
                await onSave(startDate, endDate, intensity);
            } else {
                // Starting new period
                await onSave(startDate, undefined, intensity);
            }
            onClose();
        } catch (error) {
            console.error('Failed to save period log:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const intensities: { id: 'LOW' | 'MEDIUM' | 'HIGH'; label: string }[] = [
        { id: 'LOW', label: 'Light' },
        { id: 'MEDIUM', label: 'Medium' },
        { id: 'HIGH', label: 'Heavy' },
    ];

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

                <View style={[styles.content, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: '#f1f5f9' }]}
                        >
                            <X size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.title, { color: theme.text }]}>
                            {hasActivePeriod ? 'End Period' : 'Log Period'}
                        </Text>

                        <View style={[styles.inputCard, { backgroundColor: '#fff5f5', borderColor: '#ffe4e6' }]}>
                            {hasActivePeriod ? (
                                <View style={{ width: '100%', alignItems: 'center', gap: 12, marginBottom: 20, backgroundColor: 'transparent' }}>
                                    {/* Read-only Start Date */}
                                    <View style={[styles.dateBadge, { marginBottom: 0, opacity: 0.6, width: '100%', justifyContent: 'center' }]}>
                                        <CalendarIcon size={14} color="#f43f5e" />
                                        <Text style={styles.dateText}>
                                            Start Date: {format(startDate, 'dd MMM yyyy')} (Locked)
                                        </Text>
                                    </View>
                                    
                                    {/* Tappable End Date */}
                                    <TouchableOpacity 
                                        onPress={() => setShowEndDatePicker(true)}
                                        style={[styles.dateBadge, { marginBottom: 0, width: '100%', justifyContent: 'center' }]}
                                    >
                                        <CalendarIcon size={14} color="#f43f5e" />
                                        <Text style={styles.dateText}>
                                            End Date: {format(endDate, 'dd MMM yyyy')} ✏️
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity 
                                    onPress={() => setShowStartDatePicker(true)}
                                    style={[styles.dateBadge, { width: '100%', justifyContent: 'center' }]}
                                >
                                    <CalendarIcon size={14} color="#f43f5e" />
                                    <Text style={styles.dateText}>
                                        Start Date: {format(startDate, 'dd MMM yyyy')} ✏️
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {showStartDatePicker && (
                                <RNDateTimePicker
                                    value={startDate}
                                    mode="date"
                                    display="default"
                                    onChange={onStartDateChange}
                                    accentColor="#f43f5e"
                                />
                            )}

                            {showEndDatePicker && (
                                <RNDateTimePicker
                                    value={endDate}
                                    mode="date"
                                    display="default"
                                    minimumDate={startDate}
                                    onChange={onEndDateChange}
                                    accentColor="#f43f5e"
                                />
                            )}

                            <Text style={styles.infoText}>
                                {hasActivePeriod
                                    ? `Your period started on ${format(startDate, 'dd MMM')}. Mark the date it ended.`
                                    : 'Log the start date of your period. You can choose any past date if you forgot to log it.'
                                }
                            </Text>

                            <Text style={styles.inputLabel}>Flow Intensity</Text>

                            <View style={styles.intensityContainer}>
                                {intensities.map((item) => (
                                    <TouchableOpacity
                                        key={item.id}
                                        onPress={() => setIntensity(item.id)}
                                        style={[
                                            styles.intensityButton,
                                            { backgroundColor: intensity === item.id ? '#f43f5e' : '#fff' },
                                            intensity !== item.id && { borderColor: '#f1f5f9', borderWidth: 1 }
                                        ]}
                                    >
                                        <Droplets
                                            size={20}
                                            color={intensity === item.id ? '#fff' : '#94a3b8'}
                                        />
                                        <Text style={[
                                            styles.intensityText,
                                            { color: intensity === item.id ? '#fff' : '#64748b' }
                                        ]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, { backgroundColor: '#f43f5e' }]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {hasActivePeriod ? 'END PERIOD' : 'START PERIOD'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
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
    content: {
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 16,
        maxHeight: '80%',
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        marginBottom: 24,
    },
    dateText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#f43f5e',
    },
    infoText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: '#475569',
        marginBottom: 16,
    },
    intensityContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    intensityButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 20,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    intensityText: {
        fontSize: 12,
        fontWeight: '800',
    },
    saveButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#f43f5e',
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

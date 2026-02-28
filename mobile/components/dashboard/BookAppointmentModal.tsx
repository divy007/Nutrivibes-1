
import React, { useState, useEffect } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X, Calendar, Clock, MessageCircle, Phone } from 'lucide-react-native';
import { format, addHours, setHours, setMinutes, isAfter, isBefore, startOfHour } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BookAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPlan?: string;
}

export default function BookAppointmentModal({ isOpen, onClose, selectedPlan }: BookAppointmentModalProps) {
    const IST_TIMEZONE = 'Asia/Kolkata';
    const WORKING_HOURS = { start: 9, end: 20 }; // 9 AM to 8 PM

    const getInitialDate = () => {
        const now = new Date();
        const istNow = toZonedTime(now, IST_TIMEZONE);

        // Target: 3 hours from now
        let defaultDate = addHours(istNow, 3);
        // Round to nearest 30 mins for convenience? Let's just keep it simple.
        defaultDate = startOfHour(defaultDate);

        const hour = defaultDate.getHours();

        // If after 8 PM, set to next day 10 AM
        if (hour >= WORKING_HOURS.end) {
            defaultDate = addHours(defaultDate, 24);
            defaultDate = setHours(defaultDate, 10);
            defaultDate = setMinutes(defaultDate, 0);
        } else if (hour < WORKING_HOURS.start) {
            // If before 9 AM, set to 10 AM same day
            defaultDate = setHours(defaultDate, 10);
            defaultDate = setMinutes(defaultDate, 0);
        }

        return defaultDate;
    };

    const [date, setDate] = useState(getInitialDate());
    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [isSlotBusy, setIsSlotBusy] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchBookedSlots(date);
        }
    }, [isOpen]);

    const fetchBookedSlots = async (selectedDate: Date) => {
        setLoadingSlots(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const data = await api.get(`/api/appointments/booked-slots?date=${dateStr}`) as any;
            setBookedSlots(data.bookedSlots || []);

            // Check if current selection is busy
            const selectedTime = format(selectedDate, 'hh:mm a');
            setIsSlotBusy((data.bookedSlots || []).includes(selectedTime));
        } catch (error) {
            console.error('Failed to fetch slots:', error);
        } finally {
            setLoadingSlots(false);
        }
    };

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }

        if (!selectedDate) return;

        const istSelection = toZonedTime(selectedDate, IST_TIMEZONE);
        const hour = istSelection.getHours();

        if (mode === 'time') {
            if (hour < WORKING_HOURS.start || hour >= WORKING_HOURS.end) {
                Alert.alert(
                    'Outside Working Hours',
                    'Dietician working hours are 9:00 AM to 8:00 PM IST. Please select a time within this range.'
                );
                return;
            }

            const selectedTime = format(selectedDate, 'hh:mm a');
            if (bookedSlots.includes(selectedTime)) {
                setIsSlotBusy(true);
                Alert.alert('Slot Unavailable', 'This time slot is already booked. Please select another time.');
            } else {
                setIsSlotBusy(false);
            }
        } else {
            // If date changed, fetch new slots
            fetchBookedSlots(selectedDate);
        }

        setDate(selectedDate);
    };

    const showDatepicker = () => {
        setMode('date');
        setShowPicker(true);
    };

    const showTimepicker = () => {
        setMode('time');
        setShowPicker(true);
    };

    const handleConfirm = async () => {
        if (isSlotBusy) {
            Alert.alert('Slot Unavailable', 'Please select an available time slot.');
            return;
        }

        setLoading(true);
        const formattedDate = format(date, 'dd/MM/yyyy');
        const formattedTime = format(date, 'hh:mm a');

        let message = `Hi, I'd like to book an appointment with Dt. Mansi on ${formattedDate} at ${formattedTime}.`;
        if (selectedPlan) {
            message += ` I am interested in the ${selectedPlan} plan.`;
        }
        const encodedMessage = encodeURIComponent(message);
        const phoneNumber = '919824359944'; // Country code 91 + 9824359944
        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;

        // On Android, check if we can open. 
        // We will attempt to open it directly in a try-catch block for better compatibility.
        try {
            const supported = await Linking.canOpenURL(url);

            if (supported || Platform.OS === 'android') {
                await Linking.openURL(url);
                onClose();
            } else {
                promptToCall(phoneNumber);
            }
        } catch (err) {
            // Fallback if canOpenURL throws or openURL fails
            try {
                await Linking.openURL(url);
                onClose();
            } catch (idxErr) {
                promptToCall(phoneNumber);
            }
        } finally {
            setLoading(false);
        }
    };

    const promptToCall = (phoneNumber: string) => {
        Alert.alert(
            'WhatsApp Not Available',
            'WhatsApp is not installed on this device. Would you like to call the dietician directly instead?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Call Now',
                    onPress: () => Linking.openURL(`tel:${phoneNumber}`)
                }
            ]
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
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={styles.body}>
                                <Text style={[styles.title, { color: theme.text }]}>Book Appointment</Text>

                                <Text style={styles.description}>
                                    Select your preferred date and time. We will redirect you to WhatsApp to confirm the booking.
                                </Text>

                                <View style={[styles.inputCard, { backgroundColor: theme.brandSage + '05', borderColor: theme.brandSage + '10' }]}>

                                    {/* Date Selection */}
                                    <Text style={styles.label}>Date</Text>
                                    <TouchableOpacity
                                        style={[styles.pickerButton, { backgroundColor: '#FFF', borderColor: '#f1f5f9' }]}
                                        onPress={showDatepicker}
                                    >
                                        <Text style={[styles.pickerValue, { color: theme.brandForest }]}>
                                            {format(date, 'EEEE, dd MMMM yyyy')}
                                        </Text>
                                        <Calendar size={20} color={theme.brandSage} />
                                    </TouchableOpacity>

                                    {/* Time Selection */}
                                    <Text style={styles.label}>Time</Text>
                                    <TouchableOpacity
                                        style={[styles.pickerButton, { backgroundColor: '#FFF', borderColor: '#f1f5f9' }]}
                                        onPress={showTimepicker}
                                    >
                                        <View style={[styles.infoRow, isSlotBusy && { opacity: 0.5 }]}>
                                            <Clock size={20} color={isSlotBusy ? '#ef4444' : theme.brandForest} />
                                            <View>
                                                <Text style={styles.infoLabel}>Time (IST)</Text>
                                                <Text style={[styles.infoValue, isSlotBusy && { color: '#ef4444' }]}>
                                                    {format(date, 'hh:mm a')}
                                                    {isSlotBusy && ' (Already Booked)'}
                                                </Text>
                                            </View>
                                        </View>
                                        {loadingSlots && (
                                            <ActivityIndicator size="small" color={theme.brandForest} style={{ marginLeft: 8 }} />
                                        )}
                                    </TouchableOpacity>

                                    {showPicker && (
                                        <DateTimePicker
                                            testID="dateTimePicker"
                                            value={date}
                                            mode={mode}
                                            is24Hour={false}
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onDateChange}
                                            minimumDate={new Date()} // Can't book in past
                                        />
                                    )}

                                    {/* iOS Done Check for Picker */}
                                    {Platform.OS === 'ios' && showPicker && (
                                        <TouchableOpacity
                                            style={styles.iosDoneButton}
                                            onPress={() => setShowPicker(false)}
                                        >
                                            <Text style={{ color: theme.brandForest, fontWeight: 'bold' }}>Done</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TouchableOpacity
                                    style={[styles.bookButton, { backgroundColor: '#25D366' }, (loading || isSlotBusy) && { opacity: 0.7 }]} // WhatsApp Color
                                    onPress={handleConfirm}
                                    disabled={loading || isSlotBusy}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <>
                                            <MessageCircle size={24} color="#FFF" />
                                            <Text style={styles.bookButtonText}>Book on WhatsApp</Text>
                                        </>
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
        marginBottom: 10,
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
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 12,
    },
    description: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    inputCard: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 4,
    },
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    pickerValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    iosDoneButton: {
        alignItems: 'flex-end',
        padding: 10,
        marginTop: -10,
        marginBottom: 10
    },
    bookButton: {
        width: '100%',
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#25D366',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 5,
    },
    bookButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    scrollBody: {
        paddingBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
    },
});

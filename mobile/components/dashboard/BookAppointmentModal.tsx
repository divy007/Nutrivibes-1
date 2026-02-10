
import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Linking, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X, Calendar, Clock, MessageCircle, Phone } from 'lucide-react-native';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface BookAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPlan?: string;
}

export default function BookAppointmentModal({ isOpen, onClose, selectedPlan }: BookAppointmentModalProps) {
    const [date, setDate] = useState(new Date());
    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [showPicker, setShowPicker] = useState(false);

    // Default to the next day, 10:00 AM if current time is late, or just current time?
    // Let's just default to "now" and let them pick.

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        setDate(currentDate);
    };

    const showDatepicker = () => {
        setMode('date');
        setShowPicker(true);
    };

    const showTimepicker = () => {
        setMode('time');
        setShowPicker(true);
    };

    const handleBook = async () => {
        try {
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
            }
        } catch (error) {
            console.error('Failed to open WhatsApp:', error);
            promptToCall('919824359944');
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
                                        <Text style={[styles.pickerValue, { color: theme.brandForest }]}>
                                            {format(date, 'hh:mm a')}
                                        </Text>
                                        <Clock size={20} color={theme.brandSage} />
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
                                    style={[styles.bookButton, { backgroundColor: '#25D366' }]} // WhatsApp Color
                                    onPress={handleBook}
                                >
                                    <MessageCircle size={24} color="#FFF" />
                                    <Text style={styles.bookButtonText}>Book on WhatsApp</Text>
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
});

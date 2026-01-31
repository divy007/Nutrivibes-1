
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, Switch, Linking, TextInput, ActivityIndicator, Alert } from 'react-native';
import { X, Calendar, AlertTriangle, AlertCircle, Phone } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api } from '@/lib/api-client';

interface PausePlanModalProps {
    visible: boolean;
    onClose: () => void;
    currentPauseUsed: number;
    allowedPauseDays: number; // base + extra paid
}

export const PausePlanModal: React.FC<PausePlanModalProps> = ({ visible, onClose, currentPauseUsed, allowedPauseDays }) => {
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];
    const [pauseDays, setPauseDays] = useState('7');
    const [loading, setLoading] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const remainingDays = Math.max(0, allowedPauseDays - currentPauseUsed);
    const selectedDays = parseInt(pauseDays) || 0;
    const isOverLimit = selectedDays > remainingDays;

    // Calculate cost if over limit
    let extraCost = 0;
    if (isOverLimit) {
        // Simple logic: if over, user needs to contact.
        // Or user can buy chunks. 
        // User requirements: "15 days pause -> 500", "30 days -> 1000"
        // This suggests we should probably show the relevant cost for the *total* duration they want?
        // Or the *extra* duration.
        // Let's stick to the prompt: "client should not allow to take pause, client will see the rupees banner... and client needs to inform to client"
        // So we block action and show banner.
    }

    const handlePauseRequest = async () => {
        if (!agreed) {
            Alert.alert('Agreement Required', 'Please confirm you have consulted your dietician.');
            return;
        }

        if (selectedDays < 7) {
            Alert.alert('Invalid Duration', 'Minimum pause duration is 7 days.');
            return;
        }

        if (isOverLimit) {
            // Should be handled by UI state being disabled, but safe check
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/client/subscription/pause', { days: selectedDays });
            Alert.alert('Success', `Plan paused for ${selectedDays} days.`, [
                { text: 'OK', onPress: onClose }
            ]);
        } catch (error: any) {
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to pause plan';
            Alert.alert('Error', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleContactDietician = () => {
        // Open dialer or whatsapp - placeholder
        Linking.openURL('tel:+919876543210').catch(() => { });
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.text }]}>Pause Plan</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color={theme.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Status Card */}
                        <View style={[styles.statusCard, { backgroundColor: theme.brandSage + '15' }]}>
                            <View style={styles.rowBetween}>
                                <Text style={[styles.label, { color: theme.text }]}>Allowed Pause Days</Text>
                                <Text style={[styles.value, { color: theme.brandForest }]}>{allowedPauseDays}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.text + '20' }]} />
                            <View style={styles.rowBetween}>
                                <Text style={[styles.label, { color: theme.text }]}>Used Days</Text>
                                <Text style={[styles.value, { color: theme.text }]}>{currentPauseUsed}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.text + '20' }]} />
                            <View style={styles.rowBetween}>
                                <Text style={[styles.label, { color: theme.text, fontWeight: '800' }]}>Remaining</Text>
                                <Text style={[styles.value, { color: remainingDays > 0 ? theme.brandForest : theme.secondary }]}>{remainingDays}</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Request Pause Duration</Text>
                        <Text style={[styles.subtext, { color: '#94a3b8' }]}>Minimum 7 days required. Plan expiration will be extended by these many days.</Text>

                        <View style={[styles.inputContainer, { borderColor: theme.brandSage }]}>
                            <Calendar size={20} color={theme.brandSage} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                value={pauseDays}
                                onChangeText={setPauseDays}
                                keyboardType="number-pad"
                                placeholder="7"
                                placeholderTextColor="#ccc"
                            />
                            <Text style={[styles.unit, { color: theme.text }]}>Days</Text>
                        </View>

                        {/* Agreement */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => setAgreed(!agreed)}
                            style={styles.agreementBox}
                        >
                            <View style={[styles.checkbox, { borderColor: agreed ? theme.brandForest : '#ccc', backgroundColor: agreed ? theme.brandForest : 'transparent' }]}>
                                {agreed && <View style={styles.checkInner} />}
                            </View>
                            <Text style={[styles.agreeText, { color: theme.text }]}>
                                I certify that I have informed my dietician before taking this pause.
                            </Text>
                        </TouchableOpacity>

                        {/* Logic Rendering */}
                        {isOverLimit ? (
                            <View style={[styles.errorBox, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                                <View style={styles.errorHeader}>
                                    <AlertTriangle size={20} color="#dc2626" />
                                    <Text style={styles.errorTitle}>Limit Exceeded</Text>
                                </View>
                                <Text style={styles.errorText}>
                                    You only have {remainingDays} days remaining. Additional pause days are chargeable.
                                </Text>
                                <Text style={styles.costText}>
                                    • +15 Days: ₹500{'\n'}
                                    • +30 Days: ₹1000
                                </Text>
                                <TouchableOpacity onPress={handleContactDietician} style={styles.contactBtn}>
                                    <Phone size={16} color="#fff" />
                                    <Text style={styles.contactBtnText}>Contact for Extension</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={handlePauseRequest}
                                disabled={selectedDays < 7 || !agreed || loading}
                                style={[
                                    styles.actionBtn,
                                    { backgroundColor: (selectedDays < 7 || !agreed) ? '#cbd5e1' : theme.brandForest }
                                ]}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Submit Pause Request</Text>}
                            </TouchableOpacity>
                        )}

                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    container: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: '60%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: '800' },
    closeBtn: { padding: 8, backgroundColor: '#f1f5f9', borderRadius: 20 },
    content: { gap: 20 },
    statusCard: { padding: 16, borderRadius: 16 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 13, fontWeight: '600' },
    value: { fontSize: 14, fontWeight: '800' },
    divider: { height: 1, marginVertical: 12 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
    subtext: { fontSize: 12, marginBottom: 8 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, height: 50 },
    input: { flex: 1, height: '100%', fontSize: 16, fontWeight: '700', marginLeft: 12, textAlign: 'center' },
    unit: { fontSize: 14, fontWeight: '600' },
    agreementBox: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 12, backgroundColor: '#f8fafc', borderRadius: 12 },
    checkbox: { width: 20, height: 20, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
    checkInner: { width: 10, height: 10, backgroundColor: '#fff', borderRadius: 2 },
    agreeText: { flex: 1, fontSize: 12, lineHeight: 18 },
    actionBtn: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    errorBox: { borderRadius: 12, padding: 16, borderWidth: 1 },
    errorHeader: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
    errorTitle: { color: '#dc2626', fontWeight: '800' },
    errorText: { color: '#7f1d1d', fontSize: 13, marginBottom: 8 },
    costText: { color: '#7f1d1d', fontSize: 13, fontWeight: '700', marginBottom: 12 },
    contactBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', padding: 10, borderRadius: 8 },
    contactBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 }
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useRouter, Stack } from 'expo-router';
import { User, Phone, Ruler, Weight, UserCircle, Check, Calendar, MapPin, Home } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Target } from 'lucide-react-native';
import { SelectionOption } from '@/components/ProfileOptions';
import { PRIMARY_GOALS, DIETARY_PREFERENCES, GENDER_OPTIONS } from '@/constants/Constants';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [heightFt, setHeightFt] = useState('');
    const [heightIn, setHeightIn] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [date, setDate] = useState(new Date());

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        height: '',
        weight: '',
        dob: '',
        age: '', // Derived from DOB
        city: '', // Kept for backward compatibility/read but usually replaced by address/pincode
        state: '',
        address: '',
        pincode: '',
        gender: '' as 'male' | 'female' | 'other' | '',
        preferences: '',
        primaryGoal: [] as string[]
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await api.get('/api/clients/me') as any;

            // If name is "App User", we clear it so user can type fresh
            const initialName = data.name === 'App User' ? '' : (data.name || '');

            setFormData({
                name: initialName,
                email: data.email || '',
                phone: data.phone || '',
                height: data.height?.toString() || '',
                weight: data.weight?.toString() || '',
                dob: '', // User requested no auto-fill for DOB
                age: '',
                city: data.city || '',
                state: data.state || '',
                address: data.address || '',
                pincode: data.pincode || '',
                gender: data.gender || '',
                preferences: data.dietaryPreferences && data.dietaryPreferences.length > 0 ? data.dietaryPreferences[0] : '',
                primaryGoal: Array.isArray(data.primaryGoal) ? data.primaryGoal : (data.primaryGoal ? [data.primaryGoal] : [])
            });

            // Initialize height in ft/in if we have data
            if (data.height) {
                const totalInches = data.height / 2.54;
                const feet = Math.floor(totalInches / 12);
                const inches = Math.round(totalInches % 12);
                setHeightFt(feet.toString());
                setHeightIn(inches.toString());
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.gender) {
            Alert.alert('Missing Information', 'Please select your gender');
            return;
        }
        if (!formData.preferences) {
            Alert.alert('Missing Information', 'Please select your diet preference');
            return;
        }

        const isHeightValid = heightUnit === 'cm' ? !!formData.height : (!!heightFt);
        if (!formData.name || !formData.dob || !isHeightValid || !formData.weight || formData.primaryGoal.length === 0 || !formData.pincode) {
            Alert.alert('Missing Information', 'Please fill in all mandatory fields');
            return;
        }

        // Validate Height and Weight > 0
        let heightInCm = parseFloat(formData.height);
        if (heightUnit === 'ft') {
            const ft = parseFloat(heightFt) || 0;
            const inches = parseFloat(heightIn) || 0;
            heightInCm = (ft * 30.48) + (inches * 2.54);
        } else {
            heightInCm = parseFloat(formData.height) || 0;
        }

        const weightValue = parseFloat(formData.weight) || 0;

        if (heightInCm <= 0) {
            Alert.alert('Invalid Input', 'Height must be greater than zero');
            return;
        }
        if (weightValue <= 0) {
            Alert.alert('Invalid Input', 'Weight must be greater than zero');
            return;
        }

        setSaving(true);
        try {
            // Parse DOB
            const [day, month, year] = formData.dob.split('/');
            const dobDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

            await api.patch('/api/clients/me', {
                name: formData.name,
                phone: formData.phone,
                height: heightInCm,
                weight: weightValue,
                dob: dobDate,
                city: formData.city, // Optional legacy
                address: formData.address,
                pincode: formData.pincode,
                state: formData.state,
                gender: formData.gender,
                dietaryPreferences: [formData.preferences],
                primaryGoal: formData.primaryGoal,
                isProfileComplete: true
            });

            router.replace('/audit-prompt');
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            const errorMessage = error.message || 'Failed to complete profile';
            Alert.alert('Error', errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const toggleGoal = (goal: string) => {
        setFormData(prev => {
            const goals = prev.primaryGoal.includes(goal)
                ? prev.primaryGoal.filter(g => g !== goal)
                : [...prev.primaryGoal, goal];
            return { ...prev, primaryGoal: goals };
        });
    };

    const calculateAge = (dob: string) => {
        if (!dob) return '';
        const parts = dob.split('/');
        if (parts.length !== 3) return '';

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);

        const birthDate = new Date(year, month, day);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 0 ? age.toString() : '';
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || date;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        setDate(currentDate);

        if (selectedDate) {
            const day = currentDate.getDate().toString().padStart(2, '0');
            const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const year = currentDate.getFullYear();
            const formattedDate = `${day}/${month}/${year}`;
            setFormData(prev => ({ ...prev, dob: formattedDate }));
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brandSage} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Hide Back Button */}
                <Stack.Screen options={{ headerLeft: () => null, title: 'Complete Profile' }} />

                <Stack.Screen options={{ headerLeft: () => null, title: 'Complete Profile' }} />

                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <Text style={[styles.headerTitle, { color: theme.brandForest }]}>Complete Profile</Text>
                    <Text style={styles.headerSubtitle}>Please complete your profile to continue</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Full Name</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.8 }]}>
                                <User size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: '#64748b' }]}
                                    value={formData.name}
                                    editable={false}
                                    placeholder="Enter your name"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Gender</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <View style={styles.genderRow}>
                                {GENDER_OPTIONS.map((opt) => (
                                    <SelectionOption
                                        key={opt.value}
                                        value={opt.value}
                                        label={opt.label}
                                        selected={formData.gender === opt.value}
                                        onSelect={(val) => setFormData({ ...formData, gender: val })}
                                        theme={theme}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Diet Preference</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <View style={{ gap: 8 }}>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {DIETARY_PREFERENCES.slice(0, 2).map((opt) => (
                                        <SelectionOption
                                            key={opt.value}
                                            value={opt.value}
                                            label={opt.label}
                                            selected={formData.preferences === opt.value}
                                            onSelect={(val) => setFormData({ ...formData, preferences: val })}
                                            theme={theme}
                                        />
                                    ))}
                                </View>
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    {DIETARY_PREFERENCES.slice(2).map((opt) => (
                                        <SelectionOption
                                            key={opt.value}
                                            value={opt.value}
                                            label={opt.label}
                                            selected={formData.preferences === opt.value}
                                            onSelect={(val) => setFormData({ ...formData, preferences: val })}
                                            theme={theme}
                                        />
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Primary Goal</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <View style={styles.goalGrid}>
                                {PRIMARY_GOALS.map((goal) => (
                                    <SelectionOption
                                        key={goal}
                                        value={goal}
                                        selected={formData.primaryGoal.includes(goal)}
                                        onSelect={() => toggleGoal(goal)}
                                        theme={theme}
                                        flex={false}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Date of Birth</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>

                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}
                                >
                                    <View style={{ width: 10 }} />
                                    <Text style={[styles.input, { color: formData.dob ? theme.text : '#94a3b8', paddingTop: 14 }]}>
                                        {formData.dob || 'DD/MM/YYYY'}
                                    </Text>
                                    <Calendar size={20} color="#94a3b8" />
                                </TouchableOpacity>

                                {showDatePicker && (
                                    <View>
                                        <DateTimePicker
                                            testID="dateTimePicker"
                                            value={date}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            onChange={onDateChange}
                                            maximumDate={new Date()}
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                style={{ alignItems: 'flex-end', padding: 10 }}
                                                onPress={() => setShowDatePicker(false)}
                                            >
                                                <Text style={{ color: theme.brandForest, fontWeight: 'bold' }}>Done</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {calculateAge(formData.dob) ? (
                                    <Text style={{ fontSize: 12, color: theme.brandForest, fontWeight: '700', marginLeft: 4 }}>
                                        Age: {calculateAge(formData.dob)} years
                                    </Text>
                                ) : null}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Height</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>
                                <View style={styles.unitToggle}>
                                    <TouchableOpacity
                                        style={[styles.unitButton, heightUnit === 'cm' && styles.unitButtonActive]}
                                        onPress={() => setHeightUnit('cm')}
                                    >
                                        <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>CM</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.unitButton, heightUnit === 'ft' && styles.unitButtonActive]}
                                        onPress={() => setHeightUnit('ft')}
                                    >
                                        <Text style={[styles.unitText, heightUnit === 'ft' && styles.unitTextActive]}>FT/IN</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {heightUnit === 'cm' ? (
                                <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                    <Ruler size={20} color="#94a3b8" />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={formData.height}
                                        onChangeText={(t) => setFormData({ ...formData, height: t })}
                                        placeholder="Height in cm"
                                        keyboardType="numeric"
                                    />
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={[styles.inputContainer, { flex: 1, backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={heightFt}
                                            onChangeText={setHeightFt}
                                            placeholder="Ft"
                                            keyboardType="numeric"
                                        />
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8' }}>ft</Text>
                                    </View>
                                    <View style={[styles.inputContainer, { flex: 1, backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={heightIn}
                                            onChangeText={setHeightIn}
                                            placeholder="In"
                                            keyboardType="numeric"
                                        />
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#94a3b8' }}>in</Text>
                                    </View>
                                </View>
                            )}
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                <Weight size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={formData.weight}
                                    onChangeText={(t) => setFormData({ ...formData, weight: t })}
                                    placeholder="Weight in kg"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={[styles.inputContainer, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.7 }]}>
                                <Phone size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: '#64748b' }]}
                                    value={formData.phone}
                                    editable={false}
                                    selectTextOnFocus={false}
                                    placeholder="Enter phone number"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Address</Text>
                                {/* Address is Optional per user request (only field not mandatory) */}
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', height: 80, alignItems: 'flex-start', paddingTop: 12 }]}>
                                <Home size={20} color="#94a3b8" style={{ marginTop: 2 }} />
                                <TextInput
                                    style={[styles.input, { color: theme.text, height: '100%' }]}
                                    value={formData.address}
                                    onChangeText={(t) => setFormData({ ...formData, address: t })}
                                    placeholder="Enter your full address"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row' }}>
                                <Text style={styles.label}>Pincode</Text>
                                <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                            </View>
                            <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                <MapPin size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={formData.pincode}
                                    onChangeText={(t) => setFormData({ ...formData, pincode: t })}
                                    placeholder="Enter pincode"
                                    keyboardType="number-pad"
                                    maxLength={6}
                                />
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: '#f1f5f9' }]}>
                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: theme.brandForest }]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Complete Setup</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 12,
        fontWeight: '800',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        gap: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 20,
    },
    genderRow: {
        flexDirection: 'row',
        gap: 12,
    },
    genderOption: {
        flex: 1,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    genderLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    goalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    goalOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
    },
    goalLabel: {
        fontSize: 13,
        fontWeight: '700',
    },
    unitToggle: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 2,
    },
    unitButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    unitButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    unitText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748b',
    },
    unitTextActive: {
        color: '#0f172a',
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
    },
    saveButton: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});

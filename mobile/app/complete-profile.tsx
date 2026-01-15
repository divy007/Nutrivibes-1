import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { User, Phone, Ruler, Weight, UserCircle, Check } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';
import { Target } from 'lucide-react-native';
import { SelectionOption } from '@/components/ProfileOptions';
import { PRIMARY_GOALS, DIETARY_PREFERENCES, GENDER_OPTIONS } from '@/constants/Constants';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [heightFt, setHeightFt] = useState('');
    const [heightIn, setHeightIn] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        height: '',
        weight: '',
        age: '',
        city: '',
        state: '',
        gender: '' as 'male' | 'female' | 'other' | '',
        preferences: '',
        primaryGoal: ''
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
                age: data.age?.toString() || '',
                city: data.city || '',
                state: data.state || '',
                gender: data.gender || '',
                preferences: data.dietaryPreferences && data.dietaryPreferences.length > 0 ? data.dietaryPreferences[0] : '',
                primaryGoal: data.primaryGoal || ''
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
        if (!formData.name || !formData.age || !isHeightValid || !formData.weight || !formData.primaryGoal) {
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            // Convert height to CM if unit is FT
            let heightInCm = parseFloat(formData.height);
            if (heightUnit === 'ft') {
                const ft = parseFloat(heightFt) || 0;
                const inches = parseFloat(heightIn) || 0;
                heightInCm = (ft * 30.48) + (inches * 2.54);
            }

            await api.patch('/api/clients/me', {
                name: formData.name,
                phone: formData.phone,
                height: heightInCm || undefined,
                weight: parseFloat(formData.weight) || undefined,
                age: parseInt(formData.age) || undefined,
                dob: formData.age ? new Date(new Date().getFullYear() - parseInt(formData.age), 0, 1) : undefined,
                city: formData.city,
                state: formData.state,
                gender: formData.gender,
                dietaryPreferences: [formData.preferences],
                primaryGoal: formData.primaryGoal,
                isProfileComplete: true
            });

            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Failed to update profile:', error);
            const errorMessage = error.message || 'Failed to complete profile';
            Alert.alert('Error', errorMessage);
        } finally {
            setSaving(false);
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
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.brandForest }]}>Complete Profile</Text>
                    <Text style={styles.headerSubtitle}>Please complete your profile to continue</Text>
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name *</Text>
                            <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                <User size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={formData.name}
                                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                                    placeholder="Enter your name"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Gender *</Text>
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
                            <Text style={styles.label}>Diet Preference *</Text>
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
                            <Text style={styles.label}>Primary Goal *</Text>
                            <View style={styles.goalGrid}>
                                {PRIMARY_GOALS.map((goal) => (
                                    <SelectionOption
                                        key={goal}
                                        value={goal}
                                        selected={formData.primaryGoal === goal}
                                        onSelect={(val) => setFormData({ ...formData, primaryGoal: val })}
                                        theme={theme}
                                        flex={false}
                                    />
                                ))}
                            </View>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Age *</Text>
                                <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                    <View style={{ width: 20 }} />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={formData.age}
                                        onChangeText={(t) => setFormData({ ...formData, age: t })}
                                        placeholder="Age"
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.label}>Height *</Text>
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
                            <Text style={styles.label}>Weight (kg) *</Text>
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
                            <Text style={styles.label}>Phone Number (Verified)</Text>
                            <View style={[styles.inputContainer, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', opacity: 0.8 }]}>
                                <Phone size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: '#64748b' }]}
                                    value={formData.phone}
                                    editable={false}
                                    placeholder="Enter phone number"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                <UserCircle size={20} color="#94a3b8" />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={formData.city}
                                    onChangeText={(t) => setFormData({ ...formData, city: t })}
                                    placeholder="City"
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
        paddingTop: 80,
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

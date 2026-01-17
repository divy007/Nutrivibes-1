import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, User, Phone, Ruler, Weight, UserCircle, Calendar } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Target, Check } from 'lucide-react-native';
import { SelectionOption } from '@/components/ProfileOptions';
import { PRIMARY_GOALS, DIETARY_PREFERENCES, GENDER_OPTIONS } from '@/constants/Constants';

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        height: '',
        weight: '',
        dob: '',
        age: '', // Derived for display
        city: '',
        state: '',
        gender: '' as 'male' | 'female' | 'other' | '',
        preferences: '', // Single selection logic for UI
        primaryGoal: [] as string[]
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await api.get('/api/clients/me') as any;
            setFormData({
                name: data.name || '',
                email: data.email || '',
                phone: data.phone || '',
                height: data.height?.toString() || '',
                weight: data.weight?.toString() || '',
                dob: data.dob ? new Date(data.dob).toLocaleDateString('en-GB') : '', // DD/MM/YYYY
                age: '', // We use dob now
                city: data.city || '',
                state: data.state || '',
                gender: data.gender || '',
                preferences: data.dietaryPreferences && data.dietaryPreferences.length > 0 ? data.dietaryPreferences[0] : '',
                primaryGoal: Array.isArray(data.primaryGoal) ? data.primaryGoal : (data.primaryGoal ? [data.primaryGoal] : [])
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) { Alert.alert('Missing Field', 'Full Name is required'); return; }
        if (!formData.gender) { Alert.alert('Missing Field', 'Gender is required'); return; }
        if (!formData.preferences) { Alert.alert('Missing Field', 'Diet Preference is required'); return; }
        if (formData.primaryGoal.length === 0) { Alert.alert('Missing Field', 'Please select at least one Primary Goal'); return; }
        if (!formData.phone) { Alert.alert('Missing Field', 'Phone Number is required'); return; }
        if (!formData.dob) { Alert.alert('Missing Field', 'Date of Birth is required'); return; }
        if (!isValidDate(formData.dob)) { Alert.alert('Invalid Date', 'Please enter a valid date in DD/MM/YYYY format'); return; }

        if (!formData.height) { Alert.alert('Missing Field', 'Height is required'); return; }
        if (parseFloat(formData.height) <= 0) { Alert.alert('Invalid Value', 'Height must be greater than 0'); return; }

        if (!formData.weight) { Alert.alert('Missing Field', 'Weight is required'); return; }
        if (parseFloat(formData.weight) <= 0) { Alert.alert('Invalid Value', 'Weight must be greater than 0'); return; }

        setSaving(true);
        try {
            await api.patch('/api/clients/me', {
                name: formData.name,
                phone: formData.phone,
                height: parseFloat(formData.height) || undefined,
                weight: parseFloat(formData.weight) || undefined,
                city: formData.city,
                state: formData.state,
                gender: formData.gender,
                // Convert DD/MM/YYYY to Date object
                dob: formData.dob ? (() => {
                    const [day, month, year] = formData.dob.split('/');
                    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                })() : undefined,
                dietaryPreferences: formData.preferences ? [formData.preferences] : [],
                primaryGoal: formData.primaryGoal
            });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
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

    const isValidDate = (dateString: string) => {
        // Regex to check format DD/MM/YYYY
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        if (!regex.test(dateString)) return false;

        const parts = dateString.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        // Check month range
        if (month < 1 || month > 12) return false;

        // Check year (reasonable range, e.g., not future or too old)
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear) return false;

        // Check days in month
        const daysInMonth = new Date(year, month, 0).getDate();
        if (day < 1 || day > daysInMonth) return false;

        return true;
    };



    if (loading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brandSage} />
            </View>
        );
    }


    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color={theme.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <View style={styles.avatarSection}>
                            <View style={[styles.avatarContainer, { backgroundColor: theme.brandSage }]}>
                                <Text style={styles.avatarText}>{formData.name?.[0]?.toUpperCase() || 'U'}</Text>
                            </View>
                            <Text style={[styles.emailText, { color: '#94a3b8' }]}>{formData.email}</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.inputGroup}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Full Name</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>
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
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Gender</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>
                                <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                    <UserCircle size={20} color="#94a3b8" />
                                    <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
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
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Diet Preference</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>
                                <View style={{ gap: 8 }}>
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
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
                                    <View style={{ flexDirection: 'row', gap: 8 }}>
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
                                    <Text style={styles.label}>Primary Goal (Select Multiple)</Text>
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

                            <View style={styles.inputGroup}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Phone Number</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>
                                <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                    <Phone size={20} color="#94a3b8" />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={formData.phone}
                                        onChangeText={(t) => setFormData({ ...formData, phone: t })}
                                        placeholder="Enter phone number"
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={styles.label}>Date of Birth (DD/MM/YYYY)</Text>
                                    <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                </View>
                                <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                    <Calendar size={20} color="#94a3b8" />
                                    <TextInput
                                        style={[styles.input, { color: theme.text }]}
                                        value={formData.dob}
                                        onChangeText={(t) => {
                                            // Simple mask logic or just let them type
                                            setFormData({ ...formData, dob: t });
                                        }}
                                        placeholder="DD/MM/YYYY"
                                        keyboardType="numbers-and-punctuation"
                                    />
                                </View>
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={styles.label}>Height (cm)</Text>
                                        <Text style={{ color: 'red', marginLeft: 2 }}>*</Text>
                                    </View>
                                    <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                        <Ruler size={20} color="#94a3b8" />
                                        <TextInput
                                            style={[styles.input, { color: theme.text }]}
                                            value={formData.height}
                                            onChangeText={(t) => setFormData({ ...formData, height: t })}
                                            placeholder="0"
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
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
                                            placeholder="0"
                                            keyboardType="numeric"
                                        />
                                    </View>
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
                            style={[styles.saveButton, { backgroundColor: theme.brandSage }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    content: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#FFF',
    },
    emailText: {
        fontSize: 14,
        fontWeight: '600',
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
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
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
});

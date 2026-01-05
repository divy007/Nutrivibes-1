import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { User, Phone, Ruler, Weight, UserCircle, Check } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '@/hooks/useAuth';

export default function CompleteProfileScreen() {
    const router = useRouter();
    const { login } = useAuth(); // We might need to refresh user state
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
        age: '',
        city: '',
        state: '',
        gender: '' as 'male' | 'female' | 'other' | ''
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
                age: data.age?.toString() || '',
                city: data.city || '',
                state: data.state || '',
                gender: data.gender || ''
            });
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
        if (!formData.name || !formData.age || !formData.height || !formData.weight) {
            Alert.alert('Missing Information', 'Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            await api.patch('/api/clients/me', {
                name: formData.name,
                phone: formData.phone,
                height: parseFloat(formData.height) || undefined,
                weight: parseFloat(formData.weight) || undefined,
                age: parseInt(formData.age) || undefined,
                city: formData.city,
                state: formData.state,
                gender: formData.gender,
                isProfileComplete: true // Mark profile as complete
            });

            // Refresh auth state or navigate
            // The useAuth hook should detect the change if we re-fetch, 
            // but simpler is to just navigate to tabs which will re-check
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Failed to update profile:', error);
            Alert.alert('Error', 'Failed to complete profile');
        } finally {
            setSaving(false);
        }
    };

    const GenderOption = ({ value, label }: { value: string, label: string }) => (
        <TouchableOpacity
            style={[
                styles.genderOption,
                {
                    backgroundColor: formData.gender === value ? theme.brandSage : '#f8fafc',
                    borderColor: formData.gender === value ? theme.brandForest : '#f1f5f9'
                }
            ]}
            onPress={() => setFormData({ ...formData, gender: value as any })}
        >
            <Text style={[
                styles.genderLabel,
                { color: formData.gender === value ? '#fff' : '#64748b' }
            ]}>{label}</Text>
            {formData.gender === value && <Check size={16} color="#fff" />}
        </TouchableOpacity>
    );

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
                                <GenderOption value="male" label="Male" />
                                <GenderOption value="female" label="Female" />
                                <GenderOption value="other" label="Other" />
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

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Height (cm) *</Text>
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
                                <Text style={styles.label}>Weight (kg) *</Text>
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
                            <Text style={styles.label}>Phone Number</Text>
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

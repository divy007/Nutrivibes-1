import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Phone, Ruler, Weight, UserCircle } from 'lucide-react-native';
import { api } from '@/lib/api-client';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ProfileScreen() {
    const router = useRouter();
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
        gender: '' as 'male' | 'female' | 'other' | '',
        preferences: '' // Single selection logic for UI
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
                age: data.dob ? new Date().getFullYear() - new Date(data.dob).getFullYear() : (data.age?.toString() || ''),
                city: data.city || '',
                state: data.state || '',
                gender: data.gender || '',
                // backend returns array, we take first item or join, but for Persona strict logic we take first
                preferences: data.dietaryPreferences && data.dietaryPreferences.length > 0 ? data.dietaryPreferences[0] : ''
            });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            Alert.alert('Error', 'Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
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
                // Calculate DOB from Age (approximate to Jan 1st of the birth year)
                dob: formData.age ? new Date(new Date().getFullYear() - parseInt(formData.age), 0, 1) : undefined,
                dietaryPreferences: formData.preferences ? [formData.preferences] : []
            });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
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

    const DietOption = ({ value, label }: { value: string, label: string }) => (
        <TouchableOpacity
            style={[
                styles.genderOption,
                {
                    backgroundColor: formData.preferences === value ? theme.brandSage : '#f8fafc',
                    borderColor: formData.preferences === value ? theme.brandForest : '#f1f5f9'
                }
            ]}
            onPress={() => setFormData({ ...formData, preferences: value })}
        >
            <Text style={[
                styles.genderLabel,
                { color: formData.preferences === value ? '#fff' : '#64748b', fontSize: 12 }
            ]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.header}>
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
                            <Text style={styles.label}>Full Name</Text>
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
                            <Text style={styles.label}>Gender</Text>
                            <View style={[styles.inputContainer, { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' }]}>
                                <UserCircle size={20} color="#94a3b8" />
                                <View style={{ flexDirection: 'row', gap: 16, flex: 1 }}>
                                    {['male', 'female', 'other'].map((g) => (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => setFormData({ ...formData, gender: g as any })}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                opacity: formData.gender === g ? 1 : 0.5
                                            }}
                                        >
                                            <View style={{
                                                width: 16,
                                                height: 16,
                                                borderRadius: 8,
                                                borderWidth: 2,
                                                borderColor: theme.brandForest,
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                {formData.gender === g && (
                                                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.brandForest }} />
                                                )}
                                            </View>
                                            <Text style={{ textTransform: 'capitalize', fontWeight: 'bold', color: theme.text }}>{g}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Diet Preference</Text>
                            <View style={{ gap: 8 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <DietOption value="Vegetarian" label="Vegetarian" />
                                    <DietOption value="Eggetarian" label="Eggetarian" />
                                </View>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <DietOption value="Vegan" label="Vegan" />
                                    <DietOption value="Non-Vegetarian" label="Non-Veg" />
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

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Height (cm)</Text>
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
                                <Text style={styles.label}>Weight (kg)</Text>
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
        paddingTop: 60,
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
});

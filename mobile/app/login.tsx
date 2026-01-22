import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Mail, Lock, Loader2, Eye, EyeOff, HelpCircle } from 'lucide-react-native';
import { Link, useRouter } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await api.post<any>('/api/auth/login', {
                email: email.trim().toLowerCase(),
                password
            });

            if (response.token) {
                await login(response.token);
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Image source={require('@/assets/images/brand-logo.png')} style={styles.logo} resizeMode="contain" />
                        <Text style={[styles.title, { color: theme.brandForest }]}>Welcome back!</Text>
                        <Text style={styles.subtitle}>Sign in to continue your wellness journey</Text>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.label, { color: theme.brandForest }]}>Email Address</Text>
                                <TouchableOpacity onPress={() => Alert.alert('Email Login', 'Use your registered email and password to sign in.')}>
                                    <HelpCircle size={16} color={theme.brandForest + '80'} />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputWrapper, { borderColor: theme.brandForest + '30' }]}>
                                <Mail size={20} color={theme.brandForest} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    placeholder="email@example.com"
                                    placeholderTextColor={theme.brandForest + '80'}
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={[styles.label, { color: theme.brandForest }]}>Password</Text>
                            </View>
                            <View style={[styles.inputWrapper, { borderColor: theme.brandForest + '30' }]}>
                                <Lock size={20} color={theme.brandForest} />
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholder="******"
                                    placeholderTextColor={theme.brandForest + '80'}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color={theme.brandForest} />
                                    ) : (
                                        <Eye size={20} color={theme.brandForest} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.brandForest }]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? <Loader2 color="#FFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={{ color: '#64748b' }}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/signup' as any)}>
                            <Text style={{ color: theme.brandForest, fontWeight: 'bold' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    container: { flex: 1, padding: 32, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    logo: { width: 250, height: 100, marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, fontWeight: '500', textAlign: 'center' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '700' },
    inputWrapper: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, gap: 10 },
    input: { flex: 1, fontSize: 16, fontWeight: '500' },
    button: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#1B4332', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    errorContainer: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: 20 },
    errorText: { color: '#B91C1C', fontSize: 14, fontWeight: '600', textAlign: 'center' },
    footer: { marginTop: 40, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});

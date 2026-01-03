import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Mail, Lock, Loader2, Eye, EyeOff, HelpCircle } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showEmailHelp, setShowEmailHelp] = useState(false);
    const [showPasswordHelp, setShowPasswordHelp] = useState(false);

    const { login } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const isFormValid = validateEmail(email) && password.length >= 6;

    const handleEmailChange = (text: string) => {
        setEmail(text);
        if (error) setError(null);
    };

    const handlePasswordChange = (text: string) => {
        setPassword(text);
        if (error) setError(null);
    };

    const handleEmailBlur = () => {
        if (email && !validateEmail(email)) {
            setError('Please enter a valid email address');
        }
    };

    const handleLogin = async () => {
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('Attempting login for:', email);
            const response = await api.post<any>('/api/auth/login', { email, password });
            console.log('Login response received:', !!response.token);
            if (response.token) {
                await login(response.token);
                console.log('Auth hook login completed');
            } else {
                setError('No token received');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Image
                            source={require('@/assets/images/brand-logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.title, { color: theme.brandForest }]}>Welcome back!</Text>
                        <Text style={styles.subtitle}>Sign in to continue your wellness journey</Text>
                    </View>

                    <View style={styles.form}>
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <View style={styles.labelWithIcon}>
                                    <Mail size={16} color={theme.brandForest} />
                                    <Text style={[styles.label, { color: theme.brandForest }]}>Email Address</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowEmailHelp(true)}>
                                    <HelpCircle size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputWrapper, { borderColor: theme.brandForest + '30' }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="you@example.com"
                                    placeholderTextColor={theme.brandForest + '80'}
                                    value={email}
                                    onChangeText={handleEmailChange}
                                    onBlur={handleEmailBlur}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <View style={styles.labelWithIcon}>
                                    <Lock size={16} color={theme.brandForest} />
                                    <Text style={[styles.label, { color: theme.brandForest }]}>Password</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowPasswordHelp(true)}>
                                    <HelpCircle size={16} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                            <View style={[styles.inputWrapper, { borderColor: theme.brandForest + '30' }]}>
                                <TextInput
                                    style={[styles.input, { color: theme.text }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={theme.brandForest + '80'}
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                    {showPassword ? (
                                        <EyeOff size={18} color="#94a3b8" />
                                    ) : (
                                        <Eye size={18} color="#94a3b8" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.button,
                                { backgroundColor: theme.brandForest },
                                (!isFormValid || loading) && styles.buttonDisabled
                            ]}
                            onPress={handleLogin}
                            disabled={loading || !isFormValid}
                        >
                            {loading ? (
                                <Loader2 size={24} color="#FFF" style={styles.loader} />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Email Help Modal */}
                    <Modal
                        visible={showEmailHelp}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowEmailHelp(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowEmailHelp(false)}
                        >
                            <View style={[styles.helpTooltip, { backgroundColor: theme.brandForest }]}>
                                <Text style={styles.helpText}>
                                    Please enter a valid email format (e.g., name@domain.com)
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Password Help Modal */}
                    <Modal
                        visible={showPasswordHelp}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setShowPasswordHelp(false)}
                    >
                        <TouchableOpacity
                            style={styles.modalOverlay}
                            activeOpacity={1}
                            onPress={() => setShowPasswordHelp(false)}
                        >
                            <View style={[styles.helpTooltip, { backgroundColor: theme.brandForest }]}>
                                <Text style={styles.helpText}>
                                    Password must be at least 6 characters
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </Modal>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        padding: 32,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logo: {
        width: 112,
        height: 112,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginTop: 8,
        fontWeight: '500',
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    labelWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 4,
    },
    button: {
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        shadowColor: '#1B4332',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    loader: {
        // animate spin is handled by the component normally, but in RN we might need more
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    helpTooltip: {
        padding: 16,
        borderRadius: 12,
        maxWidth: 280,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    helpText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
});

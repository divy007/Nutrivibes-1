import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, Modal, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { api } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Mail, Lock, Loader2, Eye, EyeOff, HelpCircle, Phone, Smartphone, ArrowRight } from 'lucide-react-native';
import { FirebaseRecaptchaVerifierModal, FirebaseRecaptchaBanner } from 'expo-firebase-recaptcha';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { firebaseConfig } from '@/lib/firebase-config';

export default function LoginScreen() {
    // Mode: 'PHONE' | 'OTP' | 'EMAIL'
    const [loginMode, setLoginMode] = useState<'PHONE' | 'OTP' | 'EMAIL'>('PHONE');

    // Phone State
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const recaptchaVerifier = useRef(null);

    // Email State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Shared State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const { login } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // --- Phone Auth Logic ---

    const sendOTP = async () => {
        if (phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        // Ensure +91 or code is present. For now, assume Indian numbers if missing
        const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;

        setLoading(true);
        setError(null);
        try {
            const phoneProvider = new PhoneAuthProvider(auth);
            const verificationId = await phoneProvider.verifyPhoneNumber(
                formattedPhone,
                recaptchaVerifier.current!
            );
            setVerificationId(verificationId);
            setLoginMode('OTP');
            Alert.alert('OTP Sent', 'Please check your messages.');
        } catch (err: any) {
            console.error('Send OTP Error:', err);
            setError(err.message || 'Failed to send OTP. Check config or quota.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (verificationCode.length !== 6) {
            setError('Enter a 6-digit OTP');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const credential = PhoneAuthProvider.credential(
                verificationId,
                verificationCode
            );

            // 1. Sign in to Firebase
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;
            const idToken = await user.getIdToken();

            // 2. Authenticate with Our Backend
            console.log('Verifying with backend...');
            const response = await api.post<any>('/api/auth/mobile-login', { idToken });

            if (response.token) {
                await login(response.token);
            } else {
                setError('Backend verification failed');
            }
        } catch (err: any) {
            console.error('Verify OTP Error:', err);
            setError('Invalid OTP or Verification Failed');
        } finally {
            setLoading(false);
        }
    };

    // --- Email Auth Logic ---
    const handleEmailLogin = async () => {
        // ... (Existing Email Logic)
        setLoading(true);
        try {
            const response = await api.post<any>('/api/auth/login', { email, password });
            if (response.token) await login(response.token);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };


    const renderPhoneInput = () => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.brandForest }]}>Phone Number</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.brandForest + '30' }]}>
                <Smartphone size={20} color={theme.brandForest} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="+91 99999 99999"
                    placeholderTextColor={theme.brandForest + '80'}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoFocus
                />
            </View>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brandForest }]}
                onPress={sendOTP}
                disabled={loading}
            >
                {loading ? <Loader2 color="#FFF" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
        </View>
    );

    const renderOTPInput = () => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.brandForest }]}>Enter Verification Code</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.brandForest + '30' }]}>
                <Lock size={20} color={theme.brandForest} />
                <TextInput
                    style={[styles.input, { color: theme.text, letterSpacing: 5, fontSize: 20 }]}
                    placeholder="123456"
                    placeholderTextColor={theme.brandForest + '80'}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                />
            </View>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brandForest }]}
                onPress={verifyOTP}
                disabled={loading}
            >
                {loading ? <Loader2 color="#FFF" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => setLoginMode('PHONE')}>
                <Text style={{ color: theme.brandForest }}>Change Phone Number</Text>
            </TouchableOpacity>
        </View>
    );

    const renderEmailInput = () => (
        <View style={styles.form}>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.brandForest }]}>Email</Text>
                <TextInput
                    style={[styles.inputWrapper, { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 12 }]}
                    value={email} onChangeText={setEmail} autoCapitalize="none"
                    placeholder="email@example.com"
                />
            </View>
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.brandForest }]}>Password</Text>
                <TextInput
                    style={[styles.inputWrapper, { padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 12 }]}
                    value={password} onChangeText={setPassword} secureTextEntry
                    placeholder="******"
                />
            </View>
            <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.brandForest }]}
                onPress={handleEmailLogin}
                disabled={loading}
            >
                {loading ? <Loader2 color="#FFF" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>

            <FirebaseRecaptchaVerifierModal
                ref={recaptchaVerifier}
                firebaseConfig={firebaseConfig}
            // attemptInvisibleVerification={true} // Optional
            />

            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={[styles.container, { backgroundColor: theme.background }]}>
                    <View style={styles.header}>
                        <Image source={require('@/assets/images/brand-logo.png')} style={styles.logo} resizeMode="contain" />
                        <Text style={[styles.title, { color: theme.brandForest }]}>
                            {loginMode === 'OTP' ? 'Verification' : 'Welcome back!'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {loginMode === 'OTP' ? `Enter OTP sent to ${phoneNumber}` : 'Sign in to continue your wellness journey'}
                        </Text>
                    </View>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <View style={styles.form}>
                        {loginMode === 'PHONE' && renderPhoneInput()}
                        {loginMode === 'OTP' && renderOTPInput()}
                        {loginMode === 'EMAIL' && renderEmailInput()}
                    </View>

                    {/* Switcher */}
                    <View style={{ marginTop: 40, alignItems: 'center' }}>
                        {loginMode !== 'EMAIL' ? (
                            <TouchableOpacity onPress={() => setLoginMode('EMAIL')}>
                                <Text style={{ color: '#64748b' }}>Have an email account? <Text style={{ color: theme.brandForest, fontWeight: 'bold' }}>Login with Email</Text></Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => setLoginMode('PHONE')}>
                                <Text style={{ color: '#64748b' }}>Prefer Phone Login? <Text style={{ color: theme.brandForest, fontWeight: 'bold' }}>Use Mobile OTP</Text></Text>
                            </TouchableOpacity>
                        )}
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
    header: { alignItems: 'center', marginBottom: 48 },
    logo: { width: 112, height: 112, marginBottom: 16 },
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
});

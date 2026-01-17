import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Text, View } from '@/components/Themed';
import { Phone, Mail, User, ArrowLeft } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const handleCall = () => {
        Linking.openURL('tel:9824359944');
    };

    const handleEmail = () => {
        Linking.openURL('mailto:mansianajwala2000@gmail.com');
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                    <TouchableOpacity
                        style={[styles.backButton, { backgroundColor: theme.brandSage + '20' }]}
                        onPress={() => router.back()}
                    >
                        <ArrowLeft size={20} color={theme.brandForest} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.brandForest }]}>Contact</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.card, { backgroundColor: '#fff', borderColor: theme.brandSage + '20' }]}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '20' }]}>
                            <User size={40} color={theme.brandForest} />
                        </View>

                        <Text style={[styles.title, { color: theme.brandForest }]}>Your Dietician</Text>
                        <Text style={[styles.name, { color: theme.text }]}>Dt. Mansi Anajwala</Text>

                        <View style={[styles.divider, { backgroundColor: theme.brandSage + '20' }]} />

                        <TouchableOpacity
                            style={[styles.contactButton, { backgroundColor: theme.brandForest }]}
                            onPress={handleCall}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Phone size={20} color="#fff" />
                            </View>
                            <View style={[styles.contactButtonText, { backgroundColor: 'transparent' }]}>
                                <Text style={styles.contactLabel}>Phone</Text>
                                <Text style={styles.contactValue}>9824359944</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.contactButton, { backgroundColor: theme.brandSage }]}
                            onPress={handleEmail}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                                <Mail size={20} color="#fff" />
                            </View>
                            <View style={[styles.contactButtonText, { backgroundColor: 'transparent' }]}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue}>
                                    mansianajwala2000@gmail.com
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={[styles.infoBox, { backgroundColor: theme.brandSage + '10', borderColor: theme.brandSage + '30' }]}>
                            <Text style={[styles.infoText, { color: theme.text }]}>
                                Feel free to reach out if you have any questions about your diet plan, nutrition advice, or need support on your health journey.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '900',
    },
    content: {
        padding: 24,
    },
    card: {
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        borderWidth: 1,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 24,
    },
    divider: {
        width: '100%',
        height: 1,
        marginBottom: 24,
    },
    contactButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 20,
        marginBottom: 12,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactButtonText: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#fff',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
        opacity: 0.9,
    },
    contactValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    infoBox: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        marginTop: 12,
        borderWidth: 1,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '500',
        lineHeight: 20,
        textAlign: 'center',
    },
});

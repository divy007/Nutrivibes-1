import React from 'react';
import { StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Activity, ArrowRight } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AuditPromptScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const handleStartAudit = () => {
        router.replace('/(tabs)/audit');
    };

    const handleSkip = () => {
        router.replace('/(tabs)');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '20' }]}>
                    <Activity size={60} color={theme.brandForest} />
                </View>

                <Text style={[styles.title, { color: theme.brandForest }]}>Unlock Your Health Insights</Text>

                <Text style={[styles.description, { color: theme.text }]}>
                    Take a quick 2-minute wellness audit to uncover metabolic barriers and get a personalized health score.
                </Text>

                <View style={styles.benefitList}>
                    {[
                        "Get your metabolic health score",
                        "Identify key improvement areas",
                        "Help your dietician personalize your plan"
                    ].map((benefit, index) => (
                        <View key={index} style={styles.benefitItem}>
                            <View style={[styles.bullet, { backgroundColor: theme.brandSage }]} />
                            <Text style={[styles.benefitText, { color: theme.text }]}>{benefit}</Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.brandForest }]}
                    onPress={handleStartAudit}
                >
                    <Text style={styles.primaryButtonText}>Start Wellness Audit</Text>
                    <ArrowRight size={20} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSkip}
                >
                    <Text style={[styles.secondaryButtonText, { color: theme.brandSage }]}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 36,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    benefitList: {
        width: '100%',
        gap: 16,
        paddingHorizontal: 10,
    },
    benefitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bullet: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    benefitText: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        gap: 16,
        marginBottom: 20,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    secondaryButton: {
        alignItems: 'center',
        padding: 16,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});

import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { api } from '@/lib/api-client';
import { ChevronLeft, Clock, Flame, Info, List, ChefHat } from 'lucide-react-native';

export default function RecipeDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = (Colors as any)[colorScheme ?? 'light'];
    const insets = useSafeAreaInsets();

    const [recipe, setRecipe] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const data = await api.get<any>(`/api/dietician/recipes/${id}`);
                setRecipe(data);
            } catch (error) {
                console.error("Failed to fetch recipe", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRecipe();
    }, [id]);

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.brandForest} />
            </SafeAreaView>
        );
    }

    if (!recipe) {
        return (
            <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>Recipe not found.</Text>
            </SafeAreaView>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{ headerShown: false }} />

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Header Image Area with Back Button */}
                <View style={styles.headerContainer}>
                    <View style={[styles.headerBg, { backgroundColor: theme.brandForest }]}>
                        <ChefHat size={64} color="rgba(255,255,255,0.2)" />
                    </View>

                    <View style={[styles.safeAreaHeader, { top: insets.top }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <ChevronLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.title}>{recipe.name}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Clock size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{recipe.totalTime || 'N/A'}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Flame size={14} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{recipe.calories ? `${recipe.calories} kcal` : 'Healthy'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[styles.contentContainer, { backgroundColor: theme.background }]}>

                    {/* Ingredients Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <List size={20} color={theme.brandForest} />
                            <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Ingredients</Text>
                        </View>
                        <View style={[styles.card, { backgroundColor: '#FFF', borderColor: theme.brandSage + '20' }]}>
                            {recipe.ingredients.map((ing: string, i: number) => {
                                const isHeader = ing.trim().endsWith(':');
                                return (
                                    <View key={i} style={[styles.ingredientRow, isHeader && styles.ingredientHeaderRow]}>
                                        {!isHeader && <View style={[styles.bullet, { backgroundColor: theme.brandSage }]} />}
                                        <Text style={[
                                            isHeader ? styles.ingredientHeaderText : styles.ingredientText,
                                            { color: isHeader ? theme.brandForest : theme.text }
                                        ]}>
                                            {ing}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Instructions Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Info size={20} color={theme.brandForest} />
                            <Text style={[styles.sectionTitle, { color: theme.brandForest }]}>Instructions</Text>
                        </View>
                        <View style={[styles.card, { backgroundColor: '#FFF', borderColor: theme.brandSage + '20' }]}>
                            {recipe.instructions.map((inst: string, i: number) => {
                                const isHeader = inst.trim().endsWith(':');
                                return (
                                    <View key={i} style={[styles.instructionRow, isHeader && styles.instructionHeaderRow]}>
                                        {isHeader ? (
                                            <Text style={[styles.instructionHeaderText, { color: theme.brandForest }]}>{inst}</Text>
                                        ) : (
                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                <Text style={[styles.stepNumber, { color: theme.brandSage }]}>{i + 1}</Text>
                                                <Text style={[styles.instructionText, { color: theme.text }]}>{inst}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    {/* Serving Size & Note */}
                    {(recipe.servingSize || recipe.note) && (
                        <View style={styles.section}>
                            <View style={[styles.card, { backgroundColor: '#FFF', borderColor: theme.brandSage + '20', padding: 20 }]}>
                                {recipe.servingSize && (
                                    <View style={{ marginBottom: recipe.note ? 20 : 0 }}>
                                        <Text style={[styles.sectionTitle, { fontSize: 16, color: theme.brandForest, marginBottom: 8 }]}>Serving Size</Text>
                                        <Text style={{ fontSize: 16, color: theme.text, fontWeight: '500' }}>{recipe.servingSize}</Text>
                                    </View>
                                )}

                                {recipe.note && (
                                    <View style={{ backgroundColor: theme.brandCream, padding: 16, borderRadius: 12 }}>
                                        <Text style={[styles.sectionTitle, { fontSize: 16, color: theme.brandOrange, marginBottom: 8 }]}>Note</Text>
                                        <Text style={{ fontSize: 14, color: theme.brandOrange, fontStyle: 'italic', lineHeight: 22 }}>
                                            {recipe.note}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        backgroundColor: '#1E1E1E',
        minHeight: 200,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    headerBg: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    safeAreaHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    backButton: {
        padding: 16,
        alignSelf: 'flex-start',
    },
    headerContent: {
        padding: 24,
        paddingBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#FFF',
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    metaText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '700',
    },
    contentContainer: {
        flex: 1,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -24,
        padding: 24,
        gap: 32,
    },
    section: {
        gap: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    ingredientHeaderRow: {
        marginTop: 8,
        marginBottom: 8,
    },
    ingredientText: {
        fontSize: 15,
        lineHeight: 22,
        flex: 1,
        fontWeight: '500',
    },
    ingredientHeaderText: {
        fontSize: 16,
        fontWeight: '900',
        flex: 1,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    instructionRow: {
        marginBottom: 16,
    },
    instructionHeaderRow: {
        marginTop: 8,
        marginBottom: 8,
    },
    instructionHeaderText: {
        fontSize: 16,
        fontWeight: '900',
    },
    instructionText: {
        fontSize: 15,
        lineHeight: 24,
        flex: 1,
        color: '#334155',
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '900',
        minWidth: 18,
        paddingTop: 6,
    }
});

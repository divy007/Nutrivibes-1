import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Utensils, Coffee, Sun, Moon, Plus } from 'lucide-react-native';

interface MealLogCardProps {
    logs: any[];
    onAdd: () => void;
}

export default function MealLogCard({ logs, onAdd }: MealLogCardProps) {
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    const categories = [
        { name: 'Breakfast', icon: Coffee, color: '#f59e0b' },
        { name: 'Lunch', icon: Sun, color: '#10b981' },
        { name: 'Dinner', icon: Moon, color: '#6366f1' },
        { name: 'Snacks', icon: Utensils, color: '#ec4899' },
    ];

    return (
        <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.brandSage + '10' }]}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.brandSage + '10' }]}>
                    <Utensils size={20} color={theme.brandSage} />
                </View>
                <Text style={[styles.label, { color: theme.brandForest }]}>Meal Logs</Text>
                <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: theme.brandSage }]}
                    onPress={onAdd}
                >
                    <Plus size={20} color="#FFF" />
                </TouchableOpacity>
            </View>


            <View style={styles.mealList}>
                {categories.map((cat) => {
                    const log = logs.find(l => l.category === cat.name);
                    return (
                        <View key={cat.name} style={styles.mealItem}>
                            <View style={[styles.mealIcon, { backgroundColor: cat.color + '15' }]}>
                                <cat.icon size={16} color={cat.color} />
                            </View>
                            <View style={styles.mealInfo}>
                                <Text style={[styles.mealName, { color: theme.text }]}>{cat.name}</Text>
                                <Text style={styles.mealStatus}>
                                    {log ? `${log.items.length} items logged` : 'Not logged yet'}
                                </Text>
                            </View>
                            {log && (
                                <View style={[styles.dot, { backgroundColor: cat.color }]} />
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 24,
        borderRadius: 32,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 24,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    addButton: {
        marginLeft: 'auto',
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: 24,
        backgroundColor: '#FCFCF9',
        padding: 16,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    scoreCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#52796F20',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    scoreValue: {
        fontSize: 22,
        fontWeight: '900',
    },
    scoreLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'uppercase',
    },
    stats: {
        flex: 1,
    },
    statsText: {
        fontSize: 14,
        color: '#475569',
    },
    statsSub: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 2,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    mealList: {
        gap: 12,
    },
    mealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 4,
    },
    mealIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mealInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 14,
        fontWeight: '700',
    },
    mealStatus: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '500',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    }
});

import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X, Utensils, ChevronDown, Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LogMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (
        category: string,
        items: { name: string; quantity: string }[],
        stats: {
            hungerLevel: number;
            satisfactionLevel: number;
            emotionalState: string;
            isTreat: boolean;
        }
    ) => Promise<void>;
    initialCategory?: string;
    initialItems?: { name: string; quantity: string }[];
    existingLogs?: any[];
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack', 'Early Morning'];

export default function LogMealModal({ isOpen, onClose, onSave, initialCategory, initialItems, existingLogs = [] }: LogMealModalProps) {
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [addedItems, setAddedItems] = useState<{ name: string; quantity: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // DateWithDiet State
    const [hungerLevel, setHungerLevel] = useState(5);
    const [satisfactionLevel, setSatisfactionLevel] = useState(5);
    const [emotionalState, setEmotionalState] = useState('');
    const [isTreat, setIsTreat] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

    // Helper to find items for a category
    const getItemsForCategory = (category: string) => {
        const log = existingLogs.find(l => l.category === category);
        return log ? log.items : [];
    };

    // Sync state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            const cat = initialCategory || CATEGORIES[0];
            setSelectedCategory(cat);
            // Use initialItems if provided (Edit Mode), otherwise look up in existingLogs (Add Mode but might exist)
            setAddedItems(initialItems || getItemsForCategory(cat));
            setSearchTerm('');
            setQuantity('');
            // Reset Mindful Metrics
            setHungerLevel(5);
            setSatisfactionLevel(5);
            setEmotionalState('');
            setIsTreat(false);
        }
    }, [isOpen, initialCategory, initialItems, existingLogs]);

    const handleCategoryChange = (cat: string) => {
        setSelectedCategory(cat);
        // When changing category, load its existing items so we append/edit instead of overwrite
        setAddedItems(getItemsForCategory(cat));
        setShowCategoryDropdown(false);
    }

    const handleAddItem = () => {
        if (!searchTerm || !quantity) return;
        setAddedItems([...addedItems, { name: searchTerm, quantity }]);
        setSearchTerm('');
        setQuantity('');
    };

    const handleSave = async () => {
        if (addedItems.length === 0) return;
        setIsSaving(true);
        try {
            await onSave(selectedCategory, addedItems, {
                hungerLevel,
                satisfactionLevel,
                emotionalState,
                isTreat
            });
            onClose();
        } catch (error) {
            console.error('Failed to save meal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={styles.modalContainer}>
                    <View style={[styles.content, { backgroundColor: theme.background }]}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <X size={20} color="#94a3b8" />
                            </TouchableOpacity>
                            <Text style={styles.title}>What did you eat?</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>Meal Category</Text>
                                <TouchableOpacity
                                    style={styles.categoryPicker}
                                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                >
                                    <Text style={styles.categoryText}>{selectedCategory}</Text>
                                    <ChevronDown size={18} color="#94a3b8" />
                                </TouchableOpacity>

                                {showCategoryDropdown && (
                                    <View style={styles.dropdown}>
                                        {CATEGORIES.map(cat => (
                                            <TouchableOpacity
                                                key={cat}
                                                style={[styles.dropdownItem, selectedCategory === cat && { backgroundColor: theme.brandSage + '10' }]}
                                                onPress={() => handleCategoryChange(cat)}
                                            >
                                                <Text style={[styles.dropdownText, selectedCategory === cat && { color: theme.brandForest }]}>{cat}</Text>
                                                {selectedCategory === cat && <Check size={14} color={theme.brandForest} />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={styles.inputArea}>
                                <TextInput
                                    style={styles.foodInput}
                                    placeholder="Food name (e.g. Oats)"
                                    placeholderTextColor="#94a3b8"
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                />
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.foodInput, { flex: 1, marginBottom: 0 }]}
                                        placeholder="Quantity (e.g. 1 bowl)"
                                        placeholderTextColor="#94a3b8"
                                        value={quantity}
                                        onChangeText={setQuantity}
                                    />
                                    <TouchableOpacity
                                        style={[styles.addButton, { backgroundColor: theme.brandSage }]}
                                        onPress={handleAddItem}
                                        disabled={!searchTerm || !quantity}
                                    >
                                        <Text style={styles.addButtonText}>Add</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {addedItems.length > 0 && (
                                <View style={styles.listSection}>
                                    <Text style={styles.sectionLabel}>Added Items</Text>
                                    {addedItems.map((item, idx) => (
                                        <View key={idx} style={styles.itemCard}>
                                            <View style={styles.itemInfo}>
                                                <View style={[styles.itemIcon, { backgroundColor: theme.brandSage + '10' }]}>
                                                    <Utensils size={14} color={theme.brandSage} />
                                                </View>
                                                <View>
                                                    <Text style={styles.itemName}>{item.name}</Text>
                                                    <Text style={styles.itemQuant}>{item.quantity}</Text>
                                                </View>
                                            </View>
                                            <TouchableOpacity onPress={() => setAddedItems(addedItems.filter((_, i) => i !== idx))}>
                                                <X size={16} color="#cbd5e1" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Mindful Eating Section */}
                            {addedItems.length > 0 && (
                                <View style={styles.mindfulSection}>
                                    <View style={styles.mindfulHeader}>
                                        <Text style={styles.sectionLabel}>MINDFUL CHECK-IN</Text>
                                        <View style={styles.newBadge}>
                                            <Text style={styles.newBadgeText}>NEW</Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.treatCard, isTreat && { backgroundColor: '#fce7f3', borderColor: '#fbcfe8' }]}
                                        onPress={() => setIsTreat(!isTreat)}
                                    >
                                        <Text style={[styles.treatText, isTreat && { color: '#db2777' }]}>
                                            {isTreat ? '🎉 It\'s a Treat Date!' : 'Is this a Treat Date?'}
                                        </Text>
                                        <View style={[styles.toggle, isTreat && { backgroundColor: '#db2777' }]}>
                                            <View style={[styles.toggleKnob, isTreat && { transform: [{ translateX: 14 }] }]} />
                                        </View>
                                    </TouchableOpacity>

                                    <View style={styles.slidersContainer}>
                                        <View style={styles.sliderRow}>
                                            <View style={styles.sliderLabelContainer}>
                                                <Text style={styles.sliderLabel}>Hunger</Text>
                                                <Text style={styles.sliderValue}>{hungerLevel}/10</Text>
                                            </View>
                                            <View style={styles.customSlider}>
                                                <TouchableOpacity onPress={() => setHungerLevel(Math.max(1, hungerLevel - 1))} style={styles.sliderBtn}>
                                                    <Text style={styles.sliderBtnText}>-</Text>
                                                </TouchableOpacity>
                                                <View style={styles.sliderBarContainer}>
                                                    <View style={[styles.sliderBarFill, { width: `${(hungerLevel / 10) * 100}%`, backgroundColor: '#94a3b8' }]} />
                                                </View>
                                                <TouchableOpacity onPress={() => setHungerLevel(Math.min(10, hungerLevel + 1))} style={styles.sliderBtn}>
                                                    <Text style={styles.sliderBtnText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.sliderLabels}>
                                                <Text style={styles.sliderMinMax}>Starving</Text>
                                                <Text style={styles.sliderMinMax}>Stuffed</Text>
                                            </View>
                                        </View>

                                        <View style={styles.sliderRow}>
                                            <View style={styles.sliderLabelContainer}>
                                                <Text style={styles.sliderLabel}>Satisfaction</Text>
                                                <Text style={styles.sliderValue}>{satisfactionLevel}/10</Text>
                                            </View>
                                            <View style={styles.customSlider}>
                                                <TouchableOpacity onPress={() => setSatisfactionLevel(Math.max(1, satisfactionLevel - 1))} style={styles.sliderBtn}>
                                                    <Text style={styles.sliderBtnText}>-</Text>
                                                </TouchableOpacity>
                                                <View style={styles.sliderBarContainer}>
                                                    <View style={[styles.sliderBarFill, { width: `${(satisfactionLevel / 10) * 100}%`, backgroundColor: theme.brandSage }]} />
                                                </View>
                                                <TouchableOpacity onPress={() => setSatisfactionLevel(Math.min(10, satisfactionLevel + 1))} style={styles.sliderBtn}>
                                                    <Text style={styles.sliderBtnText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <View style={styles.sliderLabels}>
                                                <Text style={styles.sliderMinMax}>Meh</Text>
                                                <Text style={styles.sliderMinMax}>Loved it</Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.moodSection}>
                                        <Text style={styles.sliderLabel}>How are you feeling?</Text>
                                        <View style={styles.moodGrid}>
                                            {['Happy 😊', 'Stressed 😫', 'Bored 😐', 'Energetic ⚡', 'Tired 😴'].map(mood => (
                                                <TouchableOpacity
                                                    key={mood}
                                                    onPress={() => setEmotionalState(emotionalState === mood ? '' : mood)}
                                                    style={[
                                                        styles.moodChip,
                                                        emotionalState === mood && { backgroundColor: theme.brandSage, borderColor: theme.brandSage }
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.moodText,
                                                        emotionalState === mood && { color: '#FFF' }
                                                    ]}>{mood}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.footer}>
                            <TouchableOpacity
                                style={[styles.logButton, { backgroundColor: theme.brandForest }, addedItems.length === 0 && { backgroundColor: '#e2e8f0' }]}
                                onPress={handleSave}
                                disabled={addedItems.length === 0 || isSaving}
                            >
                                {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.logButtonText}>LOG ENTRY</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.6)' },
    modalContainer: { width: '100%' },
    content: { borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: 40, paddingTop: 16, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
    closeButton: { padding: 8 },
    title: { fontSize: 18, fontWeight: '900' },
    scrollBody: { paddingHorizontal: 24, paddingBottom: 20 },
    section: { marginBottom: 24 },
    sectionLabel: { fontSize: 10, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
    categoryPicker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' },
    categoryText: { fontWeight: '700', color: '#334155' },
    dropdown: { backgroundColor: '#FFF', borderRadius: 16, marginTop: 8, padding: 8, borderWidth: 1, borderColor: '#f1f5f9', shadowOpacity: 0.1, elevation: 5 },
    dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12 },
    dropdownText: { fontWeight: '700', color: '#64748b', fontSize: 14 },
    inputArea: { backgroundColor: '#FFF', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 24 },
    foodInput: { height: 50, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, fontWeight: '600', marginBottom: 12, fontSize: 14, color: '#1e293b' },
    row: { flexDirection: 'row', gap: 12 },
    addButton: { paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    addButtonText: { color: '#FFF', fontWeight: '900', fontSize: 13 },
    listSection: { gap: 10 },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16 },
    itemInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    itemIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: 14, fontWeight: '700', color: '#334155' },
    itemQuant: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
    footer: { paddingHorizontal: 24, paddingTop: 16 },
    logButton: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.2, elevation: 5 },
    logButtonText: { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },

    // Mindful Section Styles
    mindfulSection: { marginTop: 24, padding: 20, backgroundColor: '#f8fafc', borderRadius: 24, borderWidth: 1, borderColor: '#f1f5f9' },
    mindfulHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    newBadge: { backgroundColor: '#52796F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    newBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },

    treatCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
    treatText: { fontWeight: '700', color: '#64748b' },
    toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', padding: 2 },
    toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 2 },

    slidersContainer: { gap: 20, marginBottom: 20 },
    sliderRow: { gap: 8 },
    sliderLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    sliderLabel: { fontSize: 12, fontWeight: '700', color: '#64748b' },
    sliderValue: { fontSize: 12, fontWeight: '900', color: '#334155' },
    customSlider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    sliderBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
    sliderBtnText: { fontSize: 18, fontWeight: '600', color: '#64748b', lineHeight: 22 },
    sliderBarContainer: { flex: 1, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
    sliderBarFill: { height: '100%', borderRadius: 3 },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    sliderMinMax: { fontSize: 10, fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase' },

    moodSection: { gap: 12 },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    moodChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#e2e8f0' },
    moodText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
});

import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { X, Utensils, ChevronDown, Check } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface LogMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: string, items: { name: string; quantity: string }[]) => Promise<void>;
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack', 'Early Morning'];

export default function LogMealModal({ isOpen, onClose, onSave }: LogMealModalProps) {
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [addedItems, setAddedItems] = useState<{ name: string; quantity: string }[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'light'];

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
            await onSave(selectedCategory, addedItems);
            setAddedItems([]);
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
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
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
                                                onPress={() => {
                                                    setSelectedCategory(cat);
                                                    setShowCategoryDropdown(false);
                                                }}
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
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                />
                                <View style={styles.row}>
                                    <TextInput
                                        style={[styles.foodInput, { flex: 1, marginBottom: 0 }]}
                                        placeholder="Quantity (e.g. 1 bowl)"
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
    foodInput: { height: 50, backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, fontWeight: '600', marginBottom: 12, fontSize: 14 },
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
});

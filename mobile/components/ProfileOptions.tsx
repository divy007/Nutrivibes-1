import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';

interface OptionProps {
    value: string;
    label?: string;
    selected: boolean;
    onSelect: (value: any) => void;
    theme: any;
    flex?: boolean;
}

export const SelectionOption = ({ value, label, selected, onSelect, theme, flex = true }: OptionProps) => (
    <TouchableOpacity
        style={[
            styles.option,
            {
                backgroundColor: selected ? theme.brandSage : '#f8fafc',
                borderColor: selected ? theme.brandForest : '#f1f5f9',
                flex: flex ? 1 : undefined
            }
        ]}
        onPress={() => onSelect(value)}
    >
        <Text style={[
            styles.label,
            { color: selected ? '#fff' : '#64748b' }
        ]}>{label || value}</Text>
        {selected && <Check size={16} color="#fff" />}
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    option: {
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
    },
});

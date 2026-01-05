import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { api } from '@/lib/api-client';
import { ClientInfo } from '@/types';

interface DietPreferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientInfo: ClientInfo;
    onUpdate: (newPreferences: string) => void;
}

const DIET_TYPES = [
    { id: 'Vegan', label: 'Vegan', description: 'No animal products (no meat, dairy, eggs, honey).' },
    { id: 'Vegetarian', label: 'Vegetarian', description: 'No meat, but dairy is allowed.' },
    { id: 'Eggetarian', label: 'Eggetarian', description: 'Vegetarian diet that includes eggs.' },
    { id: 'Non-Vegetarian', label: 'Non-Vegetarian', description: 'Includes meat, eggs, and dairy.' },
];

export const DietPreferenceModal: React.FC<DietPreferenceModalProps> = ({
    isOpen,
    onClose,
    clientInfo,
    onUpdate
}) => {
    const [selectedType, setSelectedType] = useState<string>(
        // Try to match existing preference to one of our types, defaulting to 'Vegetarian' if unclear
        DIET_TYPES.find(t => clientInfo.preferences?.includes(t.id))?.id || ''
    );
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // We're treating this as a strict single selection for the "Persona"
            // So we replace the array with just this one main preference
            await api.patch(`/api/clients/${clientInfo._id}`, {
                dietaryPreferences: [selectedType]
            });
            onUpdate(selectedType);
            onClose();
        } catch (error) {
            console.error('Failed to update diet preference:', error);
            alert('Failed to update preference');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h3 className="font-bold text-slate-800">Set Diet Persona</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-slate-200 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    {DIET_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${selectedType === type.id
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-slate-100 hover:border-orange-200 hover:bg-slate-50'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className={`block text-sm font-bold ${selectedType === type.id ? 'text-orange-700' : 'text-slate-700'
                                        }`}>
                                        {type.label}
                                    </span>
                                    <span className={`text-xs ${selectedType === type.id ? 'text-orange-600' : 'text-slate-400'
                                        }`}>
                                        {type.description}
                                    </span>
                                </div>
                                {selectedType === type.id && (
                                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedType || isLoading}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Saving...' : 'Update Persona'}
                    </button>
                </div>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface LogMeasurementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (measurements: {
        chest: number;
        arms: number;
        waist: number;
        hips: number;
        thigh: number;
    }, unit: string, date: Date) => void;
    initialValues?: {
        chest: number;
        arms: number;
        waist: number;
        hips: number;
        thigh: number;
    };
}

export const LogMeasurementModal: React.FC<LogMeasurementModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialValues = {
        chest: 36.5,
        arms: 22.5,
        waist: 32.5,
        hips: 37.5,
        thigh: 27.5
    },
}) => {
    const [values, setValues] = useState(initialValues);
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleUpdate = (field: keyof typeof values, delta: number) => {
        setValues(prev => ({
            ...prev,
            [field]: Math.max(0, Number((prev[field] + delta).toFixed(1)))
        }));
    };

    const handleInputChange = (field: keyof typeof values, value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            setValues(prev => ({ ...prev, [field]: numValue }));
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(values, 'inch', new Date());
            onClose();
        } catch (error) {
            console.error('Failed to save measurements:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const measurementFields = [
        { key: 'chest' as const, label: 'Chest', icon: '🎽' },
        { key: 'arms' as const, label: 'Arms', icon: '💪' },
        { key: 'waist' as const, label: 'Waist', icon: '🧘' },
        { key: 'hips' as const, label: 'Hips', icon: '🍑' },
        { key: 'thigh' as const, label: 'Thigh', icon: '🦵' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col relative z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-brand-forest">Measurement Tracker</h2>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                <div className="p-6 md:p-8 space-y-4 max-h-[70vh] overflow-y-auto">
                    {measurementFields.map((field) => (
                        <div key={field.key} className="bg-slate-50/80 rounded-3xl p-4 flex items-center justify-between border border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-2xl">
                                    {field.icon}
                                </div>
                                <span className="font-bold text-slate-700">{field.label}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleUpdate(field.key, -0.5)}
                                    className="w-10 h-10 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 transition-colors"
                                >
                                    <Minus size={18} />
                                </button>

                                <div className="flex flex-col items-center">
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            value={values[field.key]}
                                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                                            className="w-16 bg-transparent text-center text-xl font-black text-brand-forest outline-none border-b-2 border-slate-200 focus:border-brand-sage"
                                        />
                                        <span className="text-xs font-black text-brand-earth uppercase italic">inch</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleUpdate(field.key, 0.5)}
                                    className="w-10 h-10 rounded-full bg-brand-sage hover:bg-brand-forest flex items-center justify-center text-white transition-colors shadow-lg shadow-brand-sage/20"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 pt-4">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-5 bg-brand-sage hover:bg-brand-forest disabled:bg-slate-200 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand-sage/20 active:scale-[0.98] flex items-center justify-center"
                    >
                        {isSaving ? 'Saving...' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

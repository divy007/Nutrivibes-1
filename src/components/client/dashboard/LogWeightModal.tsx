import React, { useState } from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';

interface LogWeightModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (weight: number, unit: 'kg' | 'lb', date: Date) => void;
    initialWeight?: number;
}

export const LogWeightModal: React.FC<LogWeightModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialWeight,
}) => {
    const [weight, setWeight] = useState(initialWeight?.toString() || '');
    const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!weight || isNaN(parseFloat(weight))) return;
        setIsSaving(true);
        try {
            await onSave(parseFloat(weight), unit, new Date());
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm flex flex-col relative z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header/Close */}
                <div className="flex justify-center pt-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="px-8 pb-10 pt-4 flex flex-col items-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-8">Log weight</h2>

                    <div className="w-full bg-slate-50 rounded-2xl p-6 flex flex-col items-center mb-10 border border-slate-100/50">
                        <div className="bg-white px-4 py-1.5 rounded-full shadow-sm border border-slate-100 text-xs font-bold text-slate-500 mb-6">
                            {format(new Date(), 'dd MMMM yyyy')}
                        </div>

                        <h3 className="text-lg font-bold text-slate-700 mb-6">Enter Current Weight</h3>

                        {/* Unit Toggle */}
                        <div className="flex bg-white rounded-full p-1 border border-slate-100 shadow-sm mb-8 w-32 relative">
                            <div
                                className={`absolute inset-1 w-1/2 bg-brand-cream/50 rounded-full transition-all duration-300 ${unit === 'lb' ? 'translate-x-full' : ''}`}
                            />
                            <button
                                onClick={() => setUnit('kg')}
                                className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${unit === 'kg' ? 'text-brand-earth' : 'text-slate-400'}`}
                            >
                                KG
                            </button>
                            <button
                                onClick={() => setUnit('lb')}
                                className={`flex-1 py-1 text-[10px] font-black uppercase tracking-widest z-10 transition-colors ${unit === 'lb' ? 'text-brand-earth' : 'text-slate-400'}`}
                            >
                                LB
                            </button>
                        </div>

                        {/* Weight Input */}
                        <div className="relative w-32 flex flex-col items-center">
                            <input
                                type="number"
                                step="0.1"
                                value={weight}
                                autoFocus
                                onChange={(e) => setWeight(e.target.value)}
                                className="w-full text-center text-3xl font-black text-brand-forest bg-transparent border-b-2 border-slate-200 pb-2 focus:border-brand-sage outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                placeholder="0.0"
                            />
                            <span className="absolute right-0 bottom-4 text-xs font-black text-brand-earth uppercase">{unit}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={!weight || isSaving}
                        className="w-full py-4 bg-brand-sage hover:bg-brand-forest disabled:bg-slate-200 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-brand-sage/20 active:scale-[0.98] flex items-center justify-center"
                    >
                        {isSaving ? 'Saving...' : 'Done'}
                    </button>
                </div>
            </div>
        </div>
    );
};

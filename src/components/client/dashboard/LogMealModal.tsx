import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, ChevronDown, Utensils, Check } from 'lucide-react';
import { foodItems } from '@/data/foodItems';

interface LogMealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: string, items: { name: string; quantity: string }[]) => void;
}

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack', 'Early Morning'];

export const LogMealModal: React.FC<LogMealModalProps> = ({ isOpen, onClose, onSave }) => {
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedFood, setSelectedFood] = useState<any | null>(null);
    const [addedItems, setAddedItems] = useState<{ name: string; quantity: string }[]>([]);
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Reset when opening
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setQuantity('');
            setAddedItems([]);
            setSelectedFood(null);
        }
    }, [isOpen]);

    const filteredSuggestions = useMemo(() => {
        if (!searchTerm || selectedFood) return [];
        return foodItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [searchTerm, selectedFood]);

    const handleAddItem = () => {
        if (!searchTerm || !quantity) return;
        setAddedItems([...addedItems, { name: searchTerm, quantity }]);
        setSearchTerm('');
        setQuantity('');
        setSelectedFood(null);
    };

    const handleSave = () => {
        if (addedItems.length === 0) return;
        onSave(selectedCategory, addedItems);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg flex flex-col relative z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh]">

                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-slate-50">
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">What did you eat?</h2>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Category Selector */}
                    <div className="relative">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Meal Category</label>
                        <button
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full p-4 bg-slate-50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-brand-sage/30 transition-all shadow-sm"
                        >
                            <span className="font-bold text-slate-700">{selectedCategory}</span>
                            <ChevronDown className={`text-slate-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showCategoryDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 z-[110] overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            setSelectedCategory(cat);
                                            setShowCategoryDropdown(false);
                                        }}
                                        className={`w-full px-6 py-3 text-left font-bold text-sm transition-colors ${selectedCategory === cat ? 'bg-brand-cream text-brand-earth' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Food Search & Add */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4 shadow-sm">
                        <div className="relative" ref={suggestionsRef}>
                            <div className="flex items-center bg-slate-50 rounded-xl border border-slate-100 px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-brand-sage/20 transition-all">
                                <Search size={18} className="text-slate-400 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Add item +"
                                    className="flex-1 bg-transparent border-none outline-none font-medium text-slate-700 placeholder:text-slate-300"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowSuggestions(true);
                                        setSelectedFood(null);
                                    }}
                                />
                            </div>

                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-[120] py-2 overflow-hidden">
                                    {filteredSuggestions.map((item: any) => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setSearchTerm(item.name);
                                                setSelectedFood(item);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full px-6 py-3 text-left hover:bg-brand-cream transition-colors flex items-center justify-between"
                                        >
                                            <span className="font-medium text-slate-700 text-sm">{item.name}</span>
                                            <span className="text-[10px] font-black text-slate-300 uppercase">{item.category}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="text"
                                placeholder="Quantity (e.g. 1 bowl)"
                                className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 outline-none font-medium text-slate-700 placeholder:text-slate-400 shadow-sm focus:ring-2 focus:ring-brand-sage/20 transition-all"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            <button
                                onClick={handleAddItem}
                                disabled={!searchTerm || !quantity}
                                className="px-6 py-3 bg-brand-sage hover:bg-brand-forest disabled:bg-slate-200 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-sage/20 active:scale-95"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Added Items List */}
                    {addedItems.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Added Items</h3>
                            <div className="space-y-2">
                                {addedItems.map((item, idx) => (
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-earth">
                                                <Utensils size={14} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-700 text-sm">{item.name}</div>
                                                <div className="text-xs text-slate-400">{item.quantity}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setAddedItems(addedItems.filter((_, i) => i !== idx))}
                                            className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-red-400 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {addedItems.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-300 space-y-4 grayscale opacity-50">
                            <Utensils size={64} strokeWidth={1} />
                            <p className="font-bold text-sm uppercase tracking-widest">No meals logged yet</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50/50">
                    <button
                        onClick={handleSave}
                        disabled={addedItems.length === 0}
                        className="w-full py-4 bg-brand-forest hover:bg-brand-sage disabled:bg-slate-200 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-brand-forest/10 active:scale-[0.98]"
                    >
                        Log Entry
                    </button>
                </div>
            </div>
        </div>
    );
};

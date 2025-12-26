import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Search, X, Check, UtensilsCrossed, Calendar } from 'lucide-react';
import { FoodItem } from '@/types';
import { foodItems } from '@/data/foodItems';

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (items: FoodItem[], repeatStrategy: 'date' | 'weekly' | 'custom', selectedDays?: number[]) => void;
    existingItems: FoodItem[];
    mealCategory?: string;
    mealTime?: string;
    currentDate?: Date;
}

const DAYS = ['F', 'S', 'S', 'M', 'T', 'W', 'T'];
const FULL_DAYS = ['Friday', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    existingItems,
    mealCategory,
    mealTime,
    currentDate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [addedList, setAddedList] = useState<{ food: FoodItem; qty: string }[]>([]);
    const [repeatStrategy, setRepeatStrategy] = useState<'date' | 'weekly' | 'custom'>('date');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setQuantity('');
            setAddedList(existingItems.map(item => ({ food: item, qty: item.quantity || '' })));
            setRepeatStrategy('date');
            setSelectedDays([]);
            setSelectedFood(null);
            setShowSuggestions(false);
        }
    }, [isOpen, existingItems]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredSuggestions = useMemo(() => {
        if (!searchTerm) return [];
        return foodItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice(0, 5);
    }, [searchTerm]);

    const handleAddToList = () => {
        if (!selectedFood) return;
        setAddedList([...addedList, { food: selectedFood, qty: quantity }]);
        setSearchTerm('');
        setQuantity('');
        setSelectedFood(null);
        setShowSuggestions(false);
    };

    const removeFromList = (index: number) => {
        setAddedList(addedList.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const finalItems = addedList.map(item => ({
            ...item.food,
            quantity: item.qty
        }));
        onAdd(finalItems, repeatStrategy, selectedDays);
        onClose();
    };

    const toggleDay = (index: number) => {
        if (selectedDays.includes(index)) {
            setSelectedDays(selectedDays.filter(i => i !== index));
        } else {
            setSelectedDays([...selectedDays, index].sort());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-50 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-end p-4 pb-0">
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                <h2 className="text-xl font-bold text-slate-800 text-center -mt-8 mb-6">Add Food</h2>

                {/* Body - Two Columns */}
                <div className="flex-1 overflow-hidden flex p-6 gap-8">

                    {/* Left Column - List and Input */}
                    <div className="flex-1 flex flex-col min-w-0">
                        <h3 className="text-orange-500 font-bold mb-4 flex items-center gap-2">
                            Foods List:
                        </h3>

                        {/* List Area */}
                        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-100 overflow-y-auto mb-6 p-4 min-h-[300px]">
                            {addedList.length > 0 ? (
                                <div className="space-y-2">
                                    {addedList.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center shadow-sm">
                                            <div>
                                                <div className="font-bold text-slate-700 text-sm">{item.food.name}</div>
                                                <div className="text-xs text-slate-400 font-medium uppercase tracking-tight">{item.qty}</div>
                                            </div>
                                            <button onClick={() => removeFromList(idx)} className="text-slate-300 hover:text-red-500 p-1 transition-colors">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                    <div className="bg-white p-4 rounded-2xl mb-4 shadow-sm">
                                        <UtensilsCrossed size={48} className="text-orange-200" />
                                    </div>
                                    <span className="text-sm font-bold opacity-60">No food available!</span>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="space-y-4">
                            <div className="relative" ref={suggestionsRef}>
                                <label className="block text-xs font-bold text-slate-500 mb-1 leading-none">Food Item</label>
                                <input
                                    type="text"
                                    placeholder="Search Food"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowSuggestions(true);
                                        setSelectedFood(null);
                                    }}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div className="absolute z-[110] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 overflow-hidden">
                                        {filteredSuggestions.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => {
                                                    setSelectedFood(item);
                                                    setSearchTerm(item.name);
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full px-4 py-2 text-left text-sm hover:bg-orange-50 text-slate-700 transition-colors flex items-center justify-between"
                                            >
                                                <span>{item.name}</span>
                                                <span className="text-[10px] text-slate-400 uppercase font-black">{item.category}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 leading-none">Quantity</label>
                                <input
                                    type="text"
                                    placeholder="Enter Quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                                />
                            </div>

                            <button
                                onClick={handleAddToList}
                                disabled={!selectedFood}
                                className="w-full py-2 bg-white border border-orange-500 text-orange-500 rounded-lg text-sm font-black uppercase tracking-tight hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                            >
                                Add To List
                            </button>
                        </div>
                    </div>

                    {/* Right Column - Repeat Logic */}
                    <div className="w-[300px] border-l border-slate-100 pl-8 flex flex-col">
                        <h3 className="text-slate-700 font-bold mb-6">Repeat Foods</h3>

                        <div className="space-y-6 flex-1">
                            {/* Strategy Select */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={repeatStrategy === 'date'}
                                        onChange={() => setRepeatStrategy('date')}
                                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-orange-600 transition-colors">
                                        {currentDate ? format(currentDate, 'yyyy-MM-dd') : 'Selected Date'}
                                    </span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={repeatStrategy === 'weekly'}
                                        onChange={() => setRepeatStrategy('weekly')}
                                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-orange-600 transition-colors">Weekly</span>
                                </label>

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={repeatStrategy === 'custom'}
                                        onChange={() => setRepeatStrategy('custom')}
                                        className="w-4 h-4 accent-orange-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-orange-600 transition-colors">Custom</span>
                                </label>
                            </div>

                            {/* Custom Days Select */}
                            {repeatStrategy === 'custom' && (
                                <div className="flex gap-2">
                                    {DAYS.map((day, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => toggleDay(idx)}
                                            title={FULL_DAYS[idx]}
                                            className={`w-8 h-8 rounded-full text-[10px] font-black flex items-center justify-center transition-all border ${selectedDays.includes(idx)
                                                ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-110'
                                                : 'bg-white border-slate-200 text-slate-400 hover:border-orange-200 hover:text-orange-500'
                                                }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={addedList.length === 0}
                            className="w-full py-3 bg-orange-500 text-white rounded-lg text-sm font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Save Food
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

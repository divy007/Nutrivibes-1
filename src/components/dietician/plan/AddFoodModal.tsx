
import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { Search, X, Check, UtensilsCrossed, Calendar } from 'lucide-react';
import { FoodItem } from '@/types';
import { foodItems } from '@/data/foodItems';
import { api } from '@/lib/api-client';

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (items: FoodItem[], repeatStrategy: 'date' | 'weekly' | 'custom', selectedDays?: number[]) => void;
    existingItems: FoodItem[];
    mealCategory?: string;
    mealTime?: string;
    currentDate?: Date;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    existingItems,
    mealCategory,
    mealTime,
    currentDate
}) => {
    // Unified search - no activeTab state
    const [searchTerm, setSearchTerm] = useState('');
    const [quantity, setQuantity] = useState('');
    const [addedList, setAddedList] = useState<{ food: FoodItem; qty: string }[]>([]);
    const [repeatStrategy, setRepeatStrategy] = useState<'date' | 'weekly' | 'custom'>('date');
    const [selectedDays, setSelectedDays] = useState<number[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

    const [allRecipes, setAllRecipes] = useState<any[]>([]);

    const suggestionsRef = useRef<HTMLDivElement>(null);

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
        const fetchRecipes = async () => {
            try {
                const data = await api.get<any>('/api/dietician/recipes?limit=1000');
                setAllRecipes(data.recipes || []);
            } catch (error) {
                console.error("Failed to fetch recipes", error);
            }
        };

        if (isOpen) {
            fetchRecipes();
        }
    }, [isOpen]);

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
        const term = searchTerm.toLowerCase();

        // Search both lists
        const foods = foodItems.filter(item =>
            item.name.toLowerCase().includes(term)
        ).slice(0, 5);

        const recipes = allRecipes.filter(item =>
            item.name.toLowerCase().includes(term)
        ).slice(0, 5);

        // Combine them
        return [...recipes, ...foods];
    }, [searchTerm, allRecipes]);

    const handleAddToList = () => {
        if (!searchTerm && !selectedFood) return;

        let itemToAdd: FoodItem;

        if (selectedFood) {
            itemToAdd = selectedFood;
        } else {
            // Manual entry logic (for custom text that isn't in suggestions)
            itemToAdd = {
                id: `custom-${Date.now()}`,
                name: searchTerm,
                category: mealCategory as any || 'snack',
                portion: '1 serving',
                quantity: quantity || '1 serving',
                description: 'Custom added item',
                cuisine: 'General',
                dietPref: 'Vegetarian',
                isThyroidFriendly: true
            };
        }

        setAddedList([...addedList, { food: itemToAdd, qty: quantity || itemToAdd.quantity || '1 serving' }]);
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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="bg-white p-6 pb-0 z-20 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Add Food</h2>
                            <p className="text-slate-500 text-sm">Search across common foods and your recipes</p>
                        </div>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors border border-slate-100 shadow-sm">
                            <X size={20} />
                        </button>
                    </div>
                    {/* No Tabs - Unified Search */}
                </div>

                <div className="flex-1 overflow-hidden flex p-6 gap-8 pt-6">
                    {/* Left Column */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Search */}
                        <div className="relative z-[60]" ref={suggestionsRef}>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search food items or recipes..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowSuggestions(true); setSelectedFood(null); }}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base transition-all focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none shadow-sm"
                                />
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>

                            <div className="mt-4 flex gap-3 items-center">
                                <input
                                    type="text"
                                    placeholder="Qty (e.g., 100g)"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    // Enter key on qty also triggers add
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddToList()}
                                    className="w-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm"
                                />
                                <button
                                    onClick={handleAddToList}
                                    disabled={!searchTerm && !selectedFood}
                                    className="px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Check size={18} />
                                    Add Item
                                </button>
                            </div>

                            {/* Suggestions Dropdown */}
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="absolute top-[52px] left-0 right-0 z-50 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 overflow-hidden max-h-[300px] overflow-y-auto">
                                    {filteredSuggestions.map((item: any) => {
                                        const isRecipeItem = !!item.ingredients;
                                        return (
                                            <button
                                                key={item.id || item._id}
                                                onClick={() => {
                                                    let food: FoodItem;
                                                    if (isRecipeItem) {
                                                        food = {
                                                            id: item._id,
                                                            name: item.name,
                                                            category: mealCategory as any || 'snack',
                                                            portion: '1 serving',
                                                            quantity: '1 serving',
                                                            recipeId: item._id,
                                                            isRecipe: true,
                                                        };
                                                    } else {
                                                        food = item;
                                                    }
                                                    setSelectedFood(food);
                                                    setSearchTerm(food.name);
                                                    setQuantity(food.quantity || '1 serving');
                                                    setShowSuggestions(false);
                                                }}
                                                className="w-full px-4 py-3 text-left hover:bg-orange-50/50 transition-colors flex items-center justify-between border-b border-slate-50 last:border-0 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${isRecipeItem ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                        {isRecipeItem ? 'R' : 'F'}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-700 group-hover:text-orange-700 transition-colors">{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 capitalize">
                                                            {isRecipeItem ? 'Recipe' : (item.category || 'Food')}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isRecipeItem && (
                                                    <span className="text-[9px] font-bold text-orange-400 bg-orange-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                                        Recipe
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Staging List */}
                        <div className="flex-1 bg-slate-50/50 rounded-2xl border border-slate-200/60 overflow-hidden flex flex-col">
                            <div className="p-4 bg-slate-100/50 border-b border-slate-200/60 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center backdrop-blur-sm">
                                <span>Selected Items ({addedList.length})</span>
                                {addedList.length > 0 && (
                                    <button onClick={() => setAddedList([])} className="text-red-500 hover:text-red-700 text-[10px] font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors">
                                        CLEAR ALL
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 content-start space-y-2">
                                {addedList.length > 0 ? (
                                    addedList.map((item, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center group transition-all hover:shadow-md hover:border-orange-100">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${item.food.isRecipe ? 'bg-orange-100 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                    {item.food.isRecipe ? 'R' : 'F'}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 text-sm">{item.food.name}</div>
                                                    <div className="text-xs text-slate-400 font-medium uppercase tracking-tight">{item.qty}</div>
                                                </div>
                                            </div>
                                            <button onClick={() => removeFromList(idx)} className="text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                            <UtensilsCrossed size={24} className="opacity-20 text-slate-500" />
                                        </div>
                                        <span className="text-sm font-medium opacity-50">Your list is empty</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Repeat Logic */}
                    <div className="w-[320px] bg-slate-50/30 rounded-2xl border border-slate-100 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <h3 className="text-slate-800 font-bold leading-tight">Schedule</h3>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">When to repeat?</p>
                            </div>
                        </div>

                        <div className="space-y-3 flex-1">
                            {[
                                { id: 'date', label: currentDate ? format(currentDate, 'yyyy-MM-dd') : 'Selected Date', sub: 'Only for this day' },
                                { id: 'weekly', label: "Every Day", sub: "Apply to all 7 days of this plan" },
                                { id: 'custom', label: 'Select Specific Days', sub: 'Choose which days to apply' }
                            ].map((opt) => (
                                <label key={opt.id} className={`flex items-start gap-3 cursor-pointer group p-4 rounded-xl border transition-all ${repeatStrategy === opt.id ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-slate-100 hover:border-orange-200/50 hover:bg-orange-50/30'}`}>
                                    <div className="mt-0.5 relative">
                                        <input type="radio" checked={repeatStrategy === opt.id} onChange={() => { setRepeatStrategy(opt.id as any); if (opt.id === 'custom' && selectedDays.length === 0) setSelectedDays([]); }} className="peer sr-only" />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${repeatStrategy === opt.id ? 'border-orange-500' : 'border-slate-300'}`}>
                                            {repeatStrategy === opt.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`text-sm font-bold transition-colors ${repeatStrategy === opt.id ? 'text-slate-800' : 'text-slate-600'}`}>{opt.label}</div>
                                        <div className="text-[11px] text-slate-400 font-medium">{opt.sub}</div>
                                    </div>
                                </label>
                            ))}

                            {repeatStrategy === 'custom' && (
                                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Select Days</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {DAYS.map((day, idx) => (
                                            <button
                                                type="button"
                                                key={idx}
                                                onClick={(e) => { e.preventDefault(); toggleDay(idx); }}
                                                title={FULL_DAYS[idx]}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all border shadow-sm ${selectedDays.includes(idx) ? 'bg-slate-800 border-slate-800 text-white transform scale-110' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={addedList.length === 0}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none flex items-center justify-center gap-2"
                        >
                            <Check size={18} />
                            Save Items
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

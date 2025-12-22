import { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import { FoodItem } from '@/types';
import { foodItems } from '@/data/foodItems';

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (items: FoodItem[]) => void;
    existingItems: FoodItem[];
    mealCategory?: string;
    mealTime?: string;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
    isOpen,
    onClose,
    onAdd,
    existingItems,
    mealCategory,
    mealTime
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
    const [dietFilter, setDietFilter] = useState<string>('all');

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setDietFilter('all');
            setSelectedItems([...existingItems]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]); // keeping existingItems in dep array might be needed but isOpen trigger is key

    const filteredItems = useMemo(() => {
        const term = searchTerm.toLowerCase();
        let filtered = foodItems.filter(item =>
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term)
        );

        // Apply diet filter
        if (dietFilter !== 'all') {
            filtered = filtered.filter(item => {
                const dietPref = item.dietPref?.toLowerCase() || '';
                if (dietFilter === 'veg') {
                    return dietPref === 'vegetarian';
                } else if (dietFilter === 'non-veg') {
                    return dietPref === 'non-vegetarian';
                } else if (dietFilter === 'vegan') {
                    return dietPref === 'vegan';
                }
                return true;
            });
        }

        return filtered;
    }, [searchTerm, dietFilter]);

    const toggleSelection = (item: FoodItem) => {
        if (selectedItems.some(i => i.id === item.id)) {
            setSelectedItems(selectedItems.filter(i => i.id !== item.id));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleAdd = () => {
        onAdd(selectedItems);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Add Food</h3>
                        <p className="text-sm text-slate-500">
                            {mealTime} • {mealCategory || 'Select Item'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Selected Items (Chips) */}
                {selectedItems.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-2">
                        {selectedItems.map(item => (
                            <span
                                key={item.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                                style={{ backgroundColor: '#1b4332' }}
                            >
                                {item.name}
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleSelection(item); }}
                                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Search Bar */}
                <div className="p-4 border-b border-slate-100">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search food items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-[#2d6a4f] transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Diet Filter Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDietFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dietFilter === 'all'
                                    ? 'bg-[#2d6a4f] text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setDietFilter('veg')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dietFilter === 'veg'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Veg
                        </button>
                        <button
                            onClick={() => setDietFilter('non-veg')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dietFilter === 'non-veg'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Non-Veg
                        </button>
                        <button
                            onClick={() => setDietFilter('vegan')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${dietFilter === 'vegan'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            Vegan
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {filteredItems.length > 0 ? (
                        <div className="grid grid-cols-1 gap-1">
                            {filteredItems.map(item => {
                                const isSelected = selectedItems.some(i => i.id === item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleSelection(item)}
                                        className={`
                      flex items-center p-3 rounded-lg cursor-pointer transition-colors border
                      ${isSelected
                                                ? 'bg-[#e9edc9] border-[#ccd5ae]'
                                                : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                                            }
                    `}
                                    >
                                        <div
                                            className={`
                        w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors
                        ${isSelected
                                                    ? 'bg-[#1b4332] border-[#1b4332] text-white'
                                                    : 'border-slate-300 bg-white'
                                                }
                      `}
                                        >
                                            {isSelected && <Check className="w-3.5 h-3.5" />}
                                        </div>

                                        <div className="flex-1">
                                            <div className={`text-sm font-medium ${isSelected ? 'text-[#1b4332]' : 'text-slate-700'}`}>
                                                {item.name}
                                                {item.isThyroidFriendly && (
                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                                                        Thyroid Friendly
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <div className="text-xs text-slate-400 mt-1 italic">
                                                    {item.description}
                                                </div>
                                            )}
                                            <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                                <span>{item.portion}</span>
                                                <span>•</span>
                                                <span className="capitalize">{item.category}</span>
                                                {item.dietPref && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{item.dietPref}</span>
                                                    </>
                                                )}
                                                {item.cuisine && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{item.cuisine}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <Search className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">No food items found matching &quot;{searchTerm}&quot;</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleAdd}
                        className="px-6 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow hover:opacity-90 transition-all flex items-center gap-2 bg-[#1b4332] hover:bg-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]"
                    >
                        <Plus className="w-4 h-4" />
                        Add {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
                    </button>
                </div>

            </div>
        </div>
    );
};

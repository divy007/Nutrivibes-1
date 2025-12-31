import { FoodItem } from '@/types';
import { Pencil, Plus, Copy, Repeat, Trash2, ClipboardPaste } from 'lucide-react';

interface MealCardProps {
    mealNumber: number;
    time: string;
    foodItems: FoodItem[];
    onEdit: () => void;
    onAddFood: () => void;
    onCopy?: () => void;
    onSwap?: () => void;
    onDelete?: () => void;
    onPaste?: () => void;
    isActiveCopy?: boolean;
    isActiveSwap?: boolean;
    isPasteMode?: boolean;
    disabled?: boolean;
}

export const MealCard: React.FC<MealCardProps> = ({
    mealNumber,
    time,
    foodItems,
    onEdit,
    onAddFood,
    onCopy,
    onSwap,
    onDelete,
    onPaste,
    isActiveCopy,
    isActiveSwap,
    isPasteMode,
    disabled
}) => {
    const hasFood = foodItems.length > 0;

    return (
        <div className={`bg-white rounded-xl border transition-all duration-200 flex flex-col w-full relative group min-h-[160px] ${isActiveCopy || isActiveSwap ? 'ring-2 ring-orange-500 border-orange-200 shadow-lg scale-[1.02]' : 'border-slate-200'
            } ${disabled ? 'opacity-70 bg-slate-50/50' : 'hover:shadow-md'}`}>

            {/* Paste Overlay */}
            {isPasteMode && !isActiveCopy && !disabled && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPaste?.(); }}
                    className="absolute inset-0 z-20 bg-orange-500/10 backdrop-blur-[1px] hover:bg-orange-500/20 flex flex-col items-center justify-center gap-2 transition-all rounded-xl border-2 border-dashed border-orange-400 m-1"
                >
                    <div className="bg-white p-2.5 rounded-full shadow-lg text-orange-500 animate-bounce">
                        <ClipboardPaste size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Paste Here</span>
                </button>
            )}

            {/* Header */}
            <div className="px-3 py-2.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                        Meal {mealNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                        {time}
                    </span>
                </div>
                {!disabled && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => { e.stopPropagation(); onCopy?.(); }}
                            title="Copy slot"
                            className={`p-1.5 rounded-md transition-colors ${isActiveCopy ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:bg-white hover:text-orange-500 hover:shadow-sm'}`}
                        >
                            <Copy size={13} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onSwap?.(); }}
                            title="Swap slot"
                            className={`p-1.5 rounded-md transition-colors ${isActiveSwap ? 'bg-orange-100 text-orange-600' : 'text-slate-300 hover:bg-white hover:text-orange-500 hover:shadow-sm'}`}
                        >
                            <Repeat size={13} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                            title="Clear slot"
                            className="p-1.5 rounded-md text-slate-300 hover:bg-white hover:text-red-500 transition-colors hover:shadow-sm"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {hasFood ? (
                    <ul className="space-y-3 mb-4">
                        {foodItems.map((item) => (
                            <li key={item.id} className="flex items-start text-sm">
                                <span
                                    className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: disabled ? '#cbd5e1' : '#9c6644' }} // Grey if disabled, Warm Brown if active
                                />
                                <div className="text-slate-700 leading-snug flex-1 min-w-0">
                                    <span className={`font-medium break-words ${disabled ? 'text-slate-400' : ''}`}>{item.name}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic min-h-[80px]">
                        No items added
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className={`px-4 py-3 border-t border-slate-100 mt-auto rounded-b-xl ${disabled ? 'bg-slate-50' : 'bg-[#fdfbf7]'}`}>
                {hasFood ? (
                    <button
                        onClick={disabled ? undefined : onEdit}
                        disabled={disabled}
                        className={`w-full flex items-center justify-center gap-2 text-sm font-medium transition-colors py-1.5 border rounded-lg ${disabled
                            ? 'bg-slate-100/50 text-slate-400 border-slate-100 cursor-not-allowed'
                            : 'text-slate-600 hover:text-[#9c6644] border-slate-200 hover:border-[#ccd5ae] bg-white'
                            }`}
                    >
                        <Pencil className="w-4 h-4" />
                        Edit Food
                    </button>
                ) : (
                    <button
                        onClick={disabled ? undefined : onAddFood}
                        disabled={disabled}
                        className={`w-full flex items-center justify-center gap-2 text-sm font-medium transition-colors py-1.5 border rounded-lg ${disabled
                            ? 'bg-slate-100/50 text-slate-400 border-slate-100 cursor-not-allowed'
                            : 'text-[#9c6644] hover:text-[#8B4513] border-slate-200 hover:border-[#ccd5ae] bg-white group-hover:scale-[1.02] transform duration-200 shadow-sm'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Add Food
                    </button>
                )}
            </div>
        </div>
    );
};

import { FoodItem } from '@/types';
import { Pencil, Plus, MoreVertical } from 'lucide-react';

interface MealCardProps {
    mealNumber: number;
    time: string;
    foodItems: FoodItem[];
    onEdit: () => void;
    onAddFood: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({
    mealNumber,
    time,
    foodItems,
    onEdit,
    onAddFood
}) => {
    const hasFood = foodItems.length > 0;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col w-full relative group min-h-[160px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Meal {mealNumber}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                        {time}
                    </span>
                </div>
                <button
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
                    aria-label="More options"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {hasFood ? (
                    <ul className="space-y-3 mb-4">
                        {foodItems.map((item) => (
                            <li key={item.id} className="flex items-start text-sm">
                                <span
                                    className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: '#9c6644' }} // Warm Brown bullet
                                />
                                <div className="text-slate-700 leading-snug flex-1 min-w-0">
                                    <span className="font-medium break-words">{item.name}</span>
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
            <div className="px-4 py-3 bg-[#fdfbf7] border-t border-slate-100 mt-auto rounded-b-xl">
                {hasFood ? (
                    <button
                        onClick={onEdit}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-[#9c6644] transition-colors py-1.5 border border-slate-200 hover:border-[#ccd5ae] rounded-lg bg-white"
                    >
                        <Pencil className="w-4 h-4" />
                        Edit Food
                    </button>
                ) : (
                    <button
                        onClick={onAddFood}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-[#9c6644] hover:text-[#8B4513] transition-colors py-1.5 border border-slate-200 hover:border-[#ccd5ae] rounded-lg bg-white group-hover:scale-[1.02] transform duration-200 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Add Food
                    </button>
                )}
            </div>
        </div>
    );
};

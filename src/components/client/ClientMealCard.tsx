import { FoodItem } from '@/types';

interface ClientMealCardProps {
    mealNumber: number;
    time: string;
    foodItems: FoodItem[];
    isPublished: boolean;
}

export const ClientMealCard: React.FC<ClientMealCardProps> = ({
    mealNumber,
    time,
    foodItems,
    isPublished
}) => {
    const hasFood = foodItems.length > 0 && isPublished;

    return (
        <div className={`bg-white rounded-lg border shadow-sm flex flex-col min-h-[140px] ${isPublished ? 'border-slate-200' : 'border-slate-100 bg-slate-50/50'
            }`}>
            {/* Header */}
            <div className={`px-3 py-2 border-b flex justify-between items-center text-xs ${isPublished
                    ? 'bg-slate-50 border-slate-100 text-slate-500'
                    : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                <span className={`font-medium ${isPublished ? 'text-slate-700' : 'text-slate-400'}`}>
                    Meal {mealNumber} - {time}
                </span>
            </div>

            {/* Content */}
            <div className="p-3 flex-1">
                {hasFood ? (
                    <ul className="space-y-2">
                        {foodItems.map((item) => (
                            <li key={item.id} className="flex items-start text-sm">
                                <span className="mr-2 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                                <div className="text-slate-700 leading-snug flex-1">
                                    <span className="font-medium">{item.name}</span>
                                    {item.portion && (
                                        <span className="text-slate-500 text-xs ml-1">({item.portion})</span>
                                    )}
                                    {item.quantity && (
                                        <span className="text-slate-500 text-xs ml-1">- {item.quantity}</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
                        {isPublished ? 'No items' : 'No diet'}
                    </div>
                )}
            </div>
        </div>
    );
};

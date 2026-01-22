import React from 'react';
import { X, Clock, Globe, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api-client';

interface Recipe {
    _id: string;
    name: string;
    cookingTime?: string;
    totalTime?: string;
    language: string;
    ingredients: string[];
    instructions: string[];
    servingSize?: string;
    note?: string;
}

interface RecipeDetailDrawerProps {
    recipe: Partial<Recipe> | null;
    isOpen: boolean;
    onClose: () => void;
}

const fetcher = (url: string) => api.get<Recipe>(url);

export function RecipeDetailDrawer({ recipe: initialRecipe, isOpen, onClose }: RecipeDetailDrawerProps) {
    // Only fetch if we have an ID and the drawer is open
    const shouldFetch = isOpen && initialRecipe?._id;
    const { data: fullRecipe, isLoading } = useSWR(
        shouldFetch ? `/api/dietician/recipes/${initialRecipe._id}` : null,
        fetcher
    );

    // Use full fetched data if available, otherwise fallback to initial data (for title, etc.)
    const recipe = fullRecipe || initialRecipe as Recipe;

    if (!recipe && !isLoading) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-[150] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-[160] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-black text-slate-800 line-clamp-1">{recipe?.name}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
                            <p className="text-sm font-medium">Loading recipe details...</p>
                        </div>
                    ) : recipe ? (
                        <>
                            {/* Times & Language */}
                            <div className="grid grid-cols-2 gap-4 bg-brand-cream/30 p-4 rounded-2xl border border-brand-sage/10">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={10} /> Cooking Time
                                    </div>
                                    <div className="font-bold text-slate-700">{recipe.cookingTime || 'N/A'}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center justify-end gap-1">
                                        Total Time <Clock size={10} />
                                    </div>
                                    <div className="font-bold text-slate-700">{recipe.totalTime || 'N/A'}</div>
                                </div>
                                <div className="col-span-2 pt-2 border-t border-brand-sage/10 flex justify-between items-center">
                                    <div className="text-[10px] uppercase tracking-widest font-bold text-slate-400 flex items-center gap-1">
                                        <Globe size={10} /> Language
                                    </div>
                                    <span className="bg-white px-2 py-1 rounded-md text-xs font-bold text-brand-sage border border-brand-sage/20 shadow-sm">
                                        {recipe.language}
                                    </span>
                                </div>
                            </div>

                            {/* Ingredients */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-3 border-b border-slate-100 pb-2">Ingredients:</h3>
                                <ul className="space-y-2">
                                    {recipe.ingredients?.map((ing, i) => {
                                        const isHeader = ing.trim().endsWith(':');
                                        if (isHeader) {
                                            return (
                                                <div key={i} className="text-sm font-bold text-slate-800 pt-2 pb-1">
                                                    {ing}
                                                </div>
                                            );
                                        }
                                        return (
                                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600 pl-1">
                                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                                {ing}
                                            </li>
                                        );
                                    })}
                                    {(!recipe.ingredients || recipe.ingredients.length === 0) && (
                                        <li className="text-xs text-slate-400 italic">No ingredients listed</li>
                                    )}
                                </ul>
                            </div>

                            {/* Instructions */}
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-3 border-b border-slate-100 pb-2">Instructions:</h3>
                                <div className="space-y-4">
                                    {(() => {
                                        let stepCount = 0;
                                        return recipe.instructions?.map((inst, i) => {
                                            const isHeader = inst.trim().endsWith(':');
                                            if (isHeader) {
                                                return (
                                                    <div key={i} className="text-sm font-bold text-slate-800 pt-2 pb-1">
                                                        {inst}
                                                    </div>
                                                );
                                            }
                                            stepCount++;
                                            return (
                                                <div key={i} className="flex gap-3 text-sm text-slate-600">
                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border border-slate-200">
                                                        {stepCount}
                                                    </span>
                                                    <p className="leading-relaxed">{inst}</p>
                                                </div>
                                            );
                                        });
                                    })()}
                                    {(!recipe.instructions || recipe.instructions.length === 0) && (
                                        <p className="text-xs text-slate-400 italic">No instructions listed</p>
                                    )}
                                </div>
                            </div>
                            {/* Serving Size & Note */}
                            {(recipe.servingSize || recipe.note) && (
                                <div className="space-y-6 pt-6 border-t border-slate-100">
                                    {recipe.servingSize && (
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 mb-2">Serving Size:</h3>
                                            <p className="text-sm font-medium text-slate-600">{recipe.servingSize}</p>
                                        </div>
                                    )}

                                    {recipe.note && (
                                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                            <h3 className="text-sm font-black text-orange-800 mb-2 flex items-center gap-2">
                                                Note:
                                            </h3>
                                            <p className="text-sm text-orange-700 italic leading-relaxed">
                                                {recipe.note}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-slate-400 py-10">Failed to load recipe</div>
                    )}
                </div>
            </div>
        </>
    );
}

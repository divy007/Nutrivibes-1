'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Plus, Loader2, MoreHorizontal, ChefHat, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

import { RecipeDetailDrawer } from '@/components/dietician/recipes/RecipeDetailDrawer';

interface Recipe {
    _id: string;
    name: string;
    cookingTime?: string;
    totalTime?: string;
    language: string;
    ingredients: string[];
    instructions: string[];
}

export default function RecipesPage() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Pagination State
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on search
            fetchRecipes(1, searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setOpenMenuId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchRecipes = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const data = await api.get<{ recipes: Recipe[], pagination: any }>(`/api/dietician/recipes?page=${page}&limit=10&search=${search}`);
            setRecipes(data.recipes);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchRecipes(newPage, searchQuery);
        }
    };

    const handleActionClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleView = (e: React.MouseEvent, recipe: Recipe) => {
        e.stopPropagation();
        setSelectedRecipe(recipe);
        setOpenMenuId(null);
    };

    const handleUpdate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        router.push(`/dietician/recipes/${id}/edit`);
        setOpenMenuId(null);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <ChefHat className="text-emerald-500" />
                        Recipes Set
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage your recipe collection ({pagination.total} Total)</p>
                </div>
                <Link
                    href="/dietician/recipes/add"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-100"
                >
                    <Plus size={18} strokeWidth={3} />
                    Add Recipes
                </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Recipe..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Recipe List Table */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm min-h-[400px] flex flex-col overflow-visible">
                <div className="flex-1 overflow-visible">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Cooking Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Total Time</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-2 text-slate-400">
                                            <Loader2 className="animate-spin text-emerald-500" />
                                            <span className="text-sm font-bold">Loading recipes...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : recipes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">
                                        No recipes found. Start by adding one!
                                    </td>
                                </tr>
                            ) : (
                                recipes.map((recipe) => (
                                    <tr
                                        key={recipe._id}
                                        onClick={() => setSelectedRecipe(recipe)}
                                        className="hover:bg-emerald-50/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-700">{recipe.name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-500">{recipe.cookingTime || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-slate-500">{recipe.totalTime || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={(e) => handleUpdate(e, recipe._id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                    title="Update Recipe"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleView(e, recipe)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/30 rounded-b-[24px]">
                    <div className="text-xs font-bold text-slate-400">
                        Showing {recipes.length} of {pagination.total} Recipes
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page >= pagination.pages}
                            className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <RecipeDetailDrawer
                recipe={selectedRecipe}
                isOpen={!!selectedRecipe}
                onClose={() => setSelectedRecipe(null)}
            />
        </div>
    );
}

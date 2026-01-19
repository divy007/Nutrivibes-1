'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Save, Loader2, Info } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AddRecipePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        cookingTime: '',
        totalTime: '',
        language: 'English',
        ingredients: [''] as string[],
        instructions: [''] as string[],
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    // Dynamic Array Handlers
    const updatedArray = (field: 'ingredients' | 'instructions', index: number, value: string) => {
        const newArray = [...formData[field]];
        newArray[index] = value;
        setFormData({ ...formData, [field]: newArray });
    };

    const addItem = (field: 'ingredients' | 'instructions') => {
        setFormData({ ...formData, [field]: [...formData[field], ''] });
    };

    const removeItem = (field: 'ingredients' | 'instructions', index: number) => {
        const newArray = [...formData[field]];
        newArray.splice(index, 1);
        setFormData({ ...formData, [field]: newArray });
    };

    const handleSubmit = async () => {
        if (!formData.name) return alert('Recipe Name is required');

        setLoading(true);
        try {
            // Filter out empty lines
            const cleanData = {
                ...formData,
                ingredients: formData.ingredients.filter((i) => i.trim() !== ''),
                instructions: formData.instructions.filter((i) => i.trim() !== ''),
            };

            await api.post('/api/dietician/recipes', cleanData);
            router.push('/dietician/recipes');
        } catch (error) {
            console.error('Failed to save recipe:', error);
            alert('Failed to save recipe. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">Add Recipes</h1>
                    <p className="text-slate-500 text-sm mt-1">Create a new recipe for your clients</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm space-y-6 h-fit">
                    <h2 className="text-lg font-bold text-slate-700 mb-2">Basic Details</h2>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Name <span className="text-rose-500">*</span></label>
                        <input
                            type="text"
                            placeholder="Enter recipe name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Cooking Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cooking Time</label>
                            <input
                                type="text"
                                placeholder="e.g. 15 mins"
                                value={formData.cookingTime}
                                onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                        {/* Total Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Time</label>
                            <input
                                type="text"
                                placeholder="e.g. 45 mins"
                                value={formData.totalTime}
                                onChange={(e) => handleInputChange('totalTime', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Language <span className="text-rose-500">*</span></label>
                        <select
                            value={formData.language}
                            onChange={(e) => handleInputChange('language', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all appearance-none"
                        >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Gujarati">Gujarati</option>
                        </select>
                    </div>
                </div>

                {/* Right Column: Instructions & Ingredients */}
                <div className="space-y-8">

                    {/* Instructions */}
                    <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                Instructions
                                <div className="group relative">
                                    <Info size={14} className="text-slate-300 cursor-help" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        Add steps one by one. Empty lines will be removed automatically.
                                    </div>
                                </div>
                            </h2>
                        </div>

                        <div className="space-y-3">
                            {formData.instructions.map((instruction, index) => (
                                <div key={index} className="flex gap-2">
                                    <span className="flex-shrink-0 w-6 h-10 flex items-center justify-center text-xs font-bold text-slate-300 bg-slate-50 rounded-lg">{index + 1}</span>
                                    <textarea
                                        rows={2}
                                        placeholder={`Step ${index + 1}`}
                                        value={instruction}
                                        onChange={(e) => updatedArray('instructions', index, e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all resize-none"
                                    />
                                    {formData.instructions.length > 1 && (
                                        <button
                                            onClick={() => removeItem('instructions', index)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors h-10 w-10 flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => addItem('instructions')}
                            className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add Step
                        </button>
                    </div>

                    {/* Ingredients */}
                    <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-700 mb-6">Ingredients</h2>
                        <div className="space-y-3">
                            {formData.ingredients.map((ingredient, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="flex-shrink-0 w-2 h-10 flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-200"></div>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2 cups Rice"
                                        value={ingredient}
                                        onChange={(e) => updatedArray('ingredients', index, e.target.value)}
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all"
                                    />
                                    {formData.ingredients.length > 1 && (
                                        <button
                                            onClick={() => removeItem('ingredients', index)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors h-10 w-10 flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => addItem('ingredients')}
                            className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-sm hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add Ingredient
                        </button>
                    </div>

                </div>
            </div>

            {/* Footer / Submit */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-black py-4 px-12 rounded-xl text-lg flex items-center gap-3 transition-all shadow-lg shadow-orange-100 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    Save Recipe
                </button>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Save, Loader2, Eye, XCircle, RotateCw } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function EditRecipePage() {
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        cookingTime: '',
        totalTime: '',
        servingSize: '',
        language: 'English',
        note: '',
        instructionsRaw: '',
        instructionsFormatted: '',
        ingredientsRaw: '',
        ingredientsFormatted: '',
    });

    // Preview toggles (matching reference image eye / x buttons)
    const [previewInstructions, setPreviewInstructions] = useState(false);
    const [previewIngredients, setPreviewIngredients] = useState(false);

    // Helper: split text by '#' or newlines into clean items
    const parseHashSeparated = (text: string): string[] => {
        return text
            .split(/[#\n]+/)
            .map((item) => item.trim().replace(/^(\d+[\.\)]|[•\-\*])\s*/, '').trim())
            .filter((item) => item.length > 0);
    };

    // Helper: convert items array into formatting string with bullets only everywhere
    const formatToFormattingString = (items: string[]): string => {
        return items
            .map((item, idx) => {
                if (item.endsWith(':')) {
                    return idx === 0 ? item : `\n${item}`;
                }
                return `• ${item}`;
            })
            .join('\n');
    };

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const data = await api.get<any>(`/api/dietician/recipes/${id}`);
                const instructionsList: string[] = Array.isArray(data.instructions) ? data.instructions : [];
                const ingredientsList: string[] = Array.isArray(data.ingredients) ? data.ingredients : [];

                const instructionsHasHeaders = instructionsList.some((item) => item.endsWith(':'));
                const ingredientsHasHeaders = ingredientsList.some((item) => item.endsWith(':'));

                setFormData({
                    name: data.name || '',
                    cookingTime: data.cookingTime || '',
                    totalTime: data.totalTime || '',
                    servingSize: data.servingSize || '',
                    language: data.language || 'English',
                    note: data.note || '',
                    instructionsRaw: instructionsHasHeaders ? instructionsList.join('\n') : instructionsList.join('#'),
                    instructionsFormatted: formatToFormattingString(instructionsList),
                    ingredientsRaw: ingredientsHasHeaders ? ingredientsList.join('\n') : ingredientsList.join('#'),
                    ingredientsFormatted: formatToFormattingString(ingredientsList),
                });
            } catch (error) {
                console.error('Failed to fetch recipe:', error);
                alert('Failed to load recipe');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchRecipe();
    }, [id]);

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Handle raw instructions input & auto-generate formatting string
    const handleInstructionsRawChange = (text: string) => {
        const items = parseHashSeparated(text);
        const formatted = formatToFormattingString(items);
        setFormData((prev) => ({
            ...prev,
            instructionsRaw: text,
            instructionsFormatted: formatted,
        }));
    };

    // Handle editing instructions formatting string directly (two-way sync)
    const handleInstructionsFormattedChange = (formattedText: string) => {
        const items = formattedText
            .split('\n')
            .map((line) => line.trim().replace(/^(\d+[\.\)]|[•\-\*])\s*/, '').trim())
            .filter((line) => line.length > 0);
        const hasHeaders = items.some((item) => item.endsWith(':'));
        const raw = hasHeaders ? items.join('\n') : items.join('#');
        setFormData((prev) => ({
            ...prev,
            instructionsFormatted: formattedText,
            instructionsRaw: raw,
        }));
    };

    // Handle raw ingredients input & auto-generate formatting string
    const handleIngredientsRawChange = (text: string) => {
        const items = parseHashSeparated(text);
        const formatted = formatToFormattingString(items);
        setFormData((prev) => ({
            ...prev,
            ingredientsRaw: text,
            ingredientsFormatted: formatted,
        }));
    };

    // Handle editing ingredients formatting string directly (two-way sync)
    const handleIngredientsFormattedChange = (formattedText: string) => {
        const items = formattedText
            .split('\n')
            .map((line) => line.trim().replace(/^(\d+[\.\)]|[•\-\*])\s*/, '').trim())
            .filter((line) => line.length > 0);
        const hasHeaders = items.some((item) => item.endsWith(':'));
        const raw = hasHeaders ? items.join('\n') : items.join('#');
        setFormData((prev) => ({
            ...prev,
            ingredientsFormatted: formattedText,
            ingredientsRaw: raw,
        }));
    };

    // Sync formatting string back from raw
    const syncInstructions = () => {
        const items = parseHashSeparated(formData.instructionsRaw);
        setFormData((prev) => ({
            ...prev,
            instructionsFormatted: formatToFormattingString(items),
        }));
    };

    const syncIngredients = () => {
        const items = parseHashSeparated(formData.ingredientsRaw);
        setFormData((prev) => ({
            ...prev,
            ingredientsFormatted: formatToFormattingString(items),
        }));
    };

    // Extract final array of strings for database submission
    const extractItems = (raw: string, formatted: string): string[] => {
        if (raw.trim()) {
            return parseHashSeparated(raw);
        }
        if (formatted.trim()) {
            return formatted
                .split('\n')
                .map((line) => line.trim().replace(/^(\d+[\.\)]|[•\-\*])\s*/, '').trim())
                .filter((line) => line.length > 0);
        }
        return [];
    };

    const parsedInstructions = parseHashSeparated(formData.instructionsRaw);
    const parsedIngredients = parseHashSeparated(formData.ingredientsRaw);

    const handleSubmit = async () => {
        if (!formData.name.trim()) return alert('Recipe Name is required');

        const finalIngredients = extractItems(formData.ingredientsRaw, formData.ingredientsFormatted);
        const finalInstructions = extractItems(formData.instructionsRaw, formData.instructionsFormatted);

        setSaving(true);
        try {
            const cleanData = {
                name: formData.name.trim(),
                cookingTime: formData.cookingTime.trim(),
                totalTime: formData.totalTime.trim(),
                servingSize: formData.servingSize.trim(),
                language: formData.language,
                note: formData.note.trim(),
                ingredients: finalIngredients,
                instructions: finalInstructions,
            };

            await api.put(`/api/dietician/recipes/${id}`, cleanData);
            router.push('/dietician/recipes');
        } catch (error) {
            console.error('Failed to update recipe:', error);
            alert('Failed to update recipe. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

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
                    <h1 className="text-2xl font-black text-slate-800">Edit Recipe</h1>
                    <p className="text-slate-500 text-sm mt-1">Update details for {formData.name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Basic Details */}
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 shadow-sm space-y-6 h-fit">
                    <h2 className="text-lg font-bold text-slate-700 mb-2">Basic Details</h2>

                    {/* Name */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter recipe name"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Cooking Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cooking Time</label>
                            <input
                                type="text"
                                placeholder="Enter recipe cooking time"
                                value={formData.cookingTime}
                                onChange={(e) => handleInputChange('cookingTime', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                        {/* Total Time */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Time</label>
                            <input
                                type="text"
                                placeholder="Enter recipe total time"
                                value={formData.totalTime}
                                onChange={(e) => handleInputChange('totalTime', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Language */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Language <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={formData.language}
                                onChange={(e) => handleInputChange('language', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all appearance-none"
                            >
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                                <option value="Gujarati">Gujarati</option>
                            </select>
                        </div>
                        {/* Serving Size */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Serving Size</label>
                            <input
                                type="text"
                                placeholder="e.g. 1 bowl / 150g"
                                value={formData.servingSize}
                                onChange={(e) => handleInputChange('servingSize', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Chef's Note */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Chef's Note</label>
                        <textarea
                            rows={3}
                            placeholder="Add any dietary advice, tips, or notes for clients..."
                            value={formData.note}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all placeholder:font-medium placeholder:text-slate-400 resize-none"
                        />
                    </div>
                </div>

                {/* Right Column: Instructions & Ingredients */}
                <div className="space-y-6">

                    {/* 1. Add Instructions */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-800">
                                Add Instructions:
                            </label>
                            <div className="flex items-center gap-2">
                                {/* Info Tooltip */}
                                <div className="group relative">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold font-serif cursor-help shadow-sm">
                                        i
                                    </div>
                                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-800 text-white text-[11px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 leading-relaxed">
                                        Type instructions separated by <strong>#</strong> or new lines. Strings ending with <strong>:</strong> (e.g. <code>Prepare the Dough:</code>) will be bold section headers without bullets.
                                    </div>
                                </div>

                                {/* Preview / Edit Toggle Button */}
                                {previewInstructions ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewInstructions(false)}
                                        className="text-orange-500 hover:text-orange-600 transition-transform active:scale-95"
                                        title="Close preview (switch to edit)"
                                    >
                                        <XCircle size={20} className="fill-orange-50 stroke-orange-500" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewInstructions(true)}
                                        className="text-orange-500 hover:text-orange-600 transition-transform active:scale-95"
                                        title="Preview formatted instructions"
                                    >
                                        <Eye size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {previewInstructions ? (
                            /* Preview Mode (Bullets only everywhere, bold headers for colons) */
                            <div className="w-full min-h-[120px] p-4 bg-white border border-slate-200 rounded-xl overflow-y-auto max-h-[280px]">
                                {parsedInstructions.length > 0 ? (
                                    <div className="space-y-1">
                                        {parsedInstructions.map((instruction, idx) => {
                                            const isHeader = instruction.endsWith(':');

                                            if (isHeader) {
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`font-bold text-slate-800 text-[15px] ${idx > 0 ? 'mt-4 pt-1' : 'mt-0'} mb-1`}
                                                    >
                                                        {instruction}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 leading-relaxed">
                                                        {instruction}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No instructions entered yet</p>
                                )}
                            </div>
                        ) : (
                            /* Edit Mode */
                            <textarea
                                rows={4}
                                placeholder="Add instructions with # or new lines (e.g. Prepare the Dough:#Add bajra flour#Knead dough)"
                                value={formData.instructionsRaw}
                                onChange={(e) => handleInstructionsRawChange(e.target.value)}
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:text-slate-400 resize-y min-h-[110px]"
                            />
                        )}
                    </div>

                    {/* 2. Add Instructions Formatting String */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-800">
                                Add Instructions Formatting String:
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="group relative">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold font-serif cursor-help shadow-sm">
                                        i
                                    </div>
                                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-800 text-white text-[11px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 leading-relaxed">
                                        Auto-generated formatted instructions string. You can edit this directly or sync from raw text.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={syncInstructions}
                                    className="text-orange-500 hover:text-orange-600 transition-transform active:scale-95"
                                    title="Sync from raw instructions"
                                >
                                    <RotateCw size={17} />
                                </button>
                            </div>
                        </div>

                        <textarea
                            rows={4}
                            placeholder="Add formatting string"
                            value={formData.instructionsFormatted}
                            onChange={(e) => handleInstructionsFormattedChange(e.target.value)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:text-slate-400 resize-y min-h-[110px]"
                        />
                    </div>

                    {/* 3. Add Ingredients */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-800">
                                Add Ingredients:
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="group relative">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold font-serif cursor-help shadow-sm">
                                        i
                                    </div>
                                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-slate-800 text-white text-[11px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 leading-relaxed">
                                        Type ingredients separated by <strong>#</strong> or new lines. Strings ending with <strong>:</strong> will be bold section headers without bullets.
                                    </div>
                                </div>

                                {previewIngredients ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewIngredients(false)}
                                        className="text-orange-500 hover:text-orange-600 transition-transform active:scale-95"
                                        title="Close preview (switch to edit)"
                                    >
                                        <XCircle size={20} className="fill-orange-50 stroke-orange-500" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewIngredients(true)}
                                        className="text-orange-500 hover:text-orange-600 transition-transform active:scale-95"
                                        title="Preview formatted ingredients"
                                    >
                                        <Eye size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {previewIngredients ? (
                            /* Preview Mode (Bullets only everywhere, bold headers for colons) */
                            <div className="w-full min-h-[120px] p-4 bg-white border border-slate-200 rounded-xl overflow-y-auto max-h-[280px]">
                                {parsedIngredients.length > 0 ? (
                                    <div className="space-y-1">
                                        {parsedIngredients.map((ingredient, idx) => {
                                            const isHeader = ingredient.endsWith(':');

                                            if (isHeader) {
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`font-bold text-slate-800 text-[15px] ${idx > 0 ? 'mt-4 pt-1' : 'mt-0'} mb-1`}
                                                    >
                                                        {ingredient}
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={idx} className="flex items-start gap-2.5 pl-1 py-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                                    <span className="text-sm font-medium text-slate-700 leading-relaxed">
                                                        {ingredient}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No ingredients entered yet</p>
                                )}
                            </div>
                        ) : (
                            /* Edit Mode */
                            <textarea
                                rows={4}
                                placeholder="Add ingredients with # or new lines (e.g. For Dough:#Bajra flour#Warm water)"
                                value={formData.ingredientsRaw}
                                onChange={(e) => handleIngredientsRawChange(e.target.value)}
                                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:text-slate-400 resize-y min-h-[110px]"
                            />
                        )}
                    </div>

                    {/* 4. Add Ingredients Formatting String */}
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-bold text-slate-800">
                                Add Ingrdients Formatting String:
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="group relative">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold font-serif cursor-help shadow-sm">
                                        i
                                    </div>
                                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-slate-800 text-white text-[11px] p-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-20 leading-relaxed">
                                        Auto-generated formatted ingredients string. You can edit this directly or sync from raw text.
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={syncIngredients}
                                    className="text-orange-500 hover:text-orange-600 transition-transform active:scale-95"
                                    title="Sync from raw ingredients"
                                >
                                    <RotateCw size={17} />
                                </button>
                            </div>
                        </div>

                        <textarea
                            rows={4}
                            placeholder="Add formatting string"
                            value={formData.ingredientsFormatted}
                            onChange={(e) => handleIngredientsFormattedChange(e.target.value)}
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all placeholder:text-slate-400 resize-y min-h-[110px]"
                        />
                    </div>

                </div>
            </div>

            {/* Footer / Submit (Matching Reference Orange Button) */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3.5 px-10 rounded-xl text-base flex items-center gap-2.5 transition-all shadow-md shadow-orange-100 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Update Recipe
                </button>
            </div>
        </div>
    );
}

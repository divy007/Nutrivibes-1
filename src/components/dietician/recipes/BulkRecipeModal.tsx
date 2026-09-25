'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, Clock, Globe } from 'lucide-react';
import { api } from '@/lib/api-client';

interface BulkRecipeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRecipeAdded: () => void;
}

export interface ParsedRecipe {
    name: string;
    language: string;
    cookingTime: string;
    totalTime: string;
    servingSize: string;
    note: string;
    ingredients: string[];
    instructions: string[];
}

export function parseRecipeText(rawText: string): ParsedRecipe {
    const lines = rawText.split('\n').map((l) => l.trim());

    let name = '';
    let language = 'English';
    let cookingTime = '';
    let totalTime = '';
    let servingSize = '';
    let note = '';
    const ingredients: string[] = [];
    const instructions: string[] = [];

    type Section = 'meta' | 'ingredients' | 'instructions' | 'note';
    let currentSection: Section = 'meta';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        const lower = line.toLowerCase();

        // Detect section headers
        if (/^ingredients\s*[:]?$/i.test(line) || lower.startsWith('ingredients:')) {
            currentSection = 'ingredients';
            const remainder = line.replace(/^ingredients\s*[:]?\s*/i, '').trim();
            if (remainder) ingredients.push(remainder);
            continue;
        }

        if (/^(instructions|method|preparation|directions|steps)\s*[:]?$/i.test(line) || /^(instructions|method|preparation|directions|steps):/i.test(line)) {
            currentSection = 'instructions';
            const remainder = line.replace(/^(instructions|method|preparation|directions|steps)\s*[:]?\s*/i, '').trim();
            if (remainder) instructions.push(remainder);
            continue;
        }

        if (/^(note|notes|chef'?s note)\s*[:]?$/i.test(line) || lower.startsWith('note:') || lower.startsWith("chef's note:")) {
            currentSection = 'note';
            const remainder = line.replace(/^(note|notes|chef'?s note)\s*[:]?\s*/i, '').trim();
            if (remainder) note = remainder;
            continue;
        }

        if (currentSection === 'ingredients') {
            // Strip leading bullet/dash/number
            const cleanLine = line.replace(/^([•\-\*]|\d+[\.\)])\s*/, '').trim();
            if (cleanLine) {
                // If line contains '#' split it as well
                const subItems = cleanLine.split(/[#]+/).map(s => s.trim()).filter(Boolean);
                ingredients.push(...subItems);
            }
            continue;
        }

        if (currentSection === 'instructions') {
            const cleanLine = line.replace(/^([•\-\*]|\d+[\.\)])\s*/, '').trim();
            if (cleanLine) {
                const subItems = cleanLine.split(/[#]+/).map(s => s.trim()).filter(Boolean);
                instructions.push(...subItems);
            }
            continue;
        }

        if (currentSection === 'note') {
            note = note ? `${note} ${line}` : line;
            continue;
        }

        // Meta tags
        if (/^(display name|recipe name|name|title)\s*[:]?/i.test(line)) {
            const sameLineVal = line.replace(/^(display name|recipe name|name|title)\s*[:]?\s*/i, '').trim();
            if (sameLineVal) {
                name = sameLineVal;
            } else if (i + 1 < lines.length && !lines[i + 1].includes(':')) {
                name = lines[++i];
            }
            continue;
        }

        if (/^(cooking time|cook time)\s*[:]?/i.test(line)) {
            const sameLineVal = line.replace(/^(cooking time|cook time)\s*[:]?\s*/i, '').trim();
            if (sameLineVal) {
                cookingTime = sameLineVal;
            } else if (i + 1 < lines.length && !lines[i + 1].includes(':')) {
                cookingTime = lines[++i];
            }
            continue;
        }

        if (/^(total time|prep time)\s*[:]?/i.test(line)) {
            const sameLineVal = line.replace(/^(total time|prep time)\s*[:]?\s*/i, '').trim();
            if (sameLineVal) {
                totalTime = sameLineVal;
            } else if (i + 1 < lines.length && !lines[i + 1].includes(':')) {
                totalTime = lines[++i];
            }
            continue;
        }

        if (/^(serving size|servings)\s*[:]?/i.test(line)) {
            const sameLineVal = line.replace(/^(serving size|servings)\s*[:]?\s*/i, '').trim();
            if (sameLineVal) {
                servingSize = sameLineVal;
            } else if (i + 1 < lines.length && !lines[i + 1].includes(':')) {
                servingSize = lines[++i];
            }
            continue;
        }

        if (/^(language)\s*[:]?/i.test(line)) {
            const sameLineVal = line.replace(/^(language)\s*[:]?\s*/i, '').trim();
            if (sameLineVal) {
                language = sameLineVal;
            } else if (i + 1 < lines.length && !lines[i + 1].includes(':')) {
                language = lines[++i];
            }
            continue;
        }

        if (/^(english|hindi|gujarati)$/i.test(line)) {
            language = line.charAt(0).toUpperCase() + line.slice(1).toLowerCase();
            continue;
        }

        // If name is not set and line has no colon, it's likely the recipe title
        if (!name && !line.includes(':')) {
            name = line;
        }
    }

    return {
        name,
        language: ['English', 'Hindi', 'Gujarati'].includes(language) ? language : 'English',
        cookingTime,
        totalTime,
        servingSize,
        note,
        ingredients,
        instructions,
    };
}

const SAMPLE_TEXT = `Display Name:
Weight Loss Bhel Puri
English
Cooking Time:
20 Mins

Total Time:

Ingredients:
Murmura - 2 cup
Onion - 1
Tomato - 1
Cucumber - 1
Pomegranate - 1 tsp
Salt - 0.5 tsp
Chat Masala - 0.5 tsp
Coriander Leaf - 2 tbsp
Green Chilli - 2
Coriander Chutney - 2 tsp

Instructions:
Take 2 bowls of murmure or puffed rice.
Then add finely-chopped onion, tomato and cucumber to it.
Add himalyan pink salt, chaat masala and coriander chutney.
Finally squeeze a lemon on top.
You can add coriander leaves and sprinkle some anar seeds on top (optional).
Now give the ingredients in the bowl a good toss and serve!`;

export function BulkRecipeModal({ isOpen, onClose, onRecipeAdded }: BulkRecipeModalProps) {
    const [rawText, setRawText] = useState('');
    const [parsed, setParsed] = useState<ParsedRecipe>({
        name: '',
        language: 'English',
        cookingTime: '',
        totalTime: '',
        servingSize: '',
        note: '',
        ingredients: [],
        instructions: [],
    });
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (rawText.trim()) {
            setParsed(parseRecipeText(rawText));
            setErrorMsg('');
        } else {
            setParsed({
                name: '',
                language: 'English',
                cookingTime: '',
                totalTime: '',
                servingSize: '',
                note: '',
                ingredients: [],
                instructions: [],
            });
        }
    }, [rawText]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!parsed.name.trim()) {
            setErrorMsg('Recipe Name could not be detected. Please provide a Name in the text.');
            return;
        }

        setSaving(true);
        setErrorMsg('');
        try {
            const payload = {
                name: parsed.name.trim(),
                cookingTime: parsed.cookingTime.trim(),
                totalTime: parsed.totalTime.trim(),
                servingSize: parsed.servingSize.trim(),
                language: parsed.language || 'English',
                note: parsed.note.trim(),
                ingredients: parsed.ingredients,
                instructions: parsed.instructions,
            };

            await api.post('/api/dietician/recipes', payload);
            setRawText('');
            onRecipeAdded();
            onClose();
        } catch (err: unknown) {
            console.error('Failed to bulk add recipe:', err);
            const error = err as { message?: string };
            setErrorMsg(error?.message || 'Failed to save recipe. Please check details and try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[28px] shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Bulk Recipe Import</h2>
                            <p className="text-slate-500 text-xs mt-0.5">
                                Paste raw recipe text from WhatsApp, notes, or documents. We parse it automatically!
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body: Split into Paste Area and Live Preview */}
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column: Raw Paste Input */}
                    <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                                Paste Recipe Text
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRawText(SAMPLE_TEXT)}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                                >
                                    Load Sample
                                </button>
                                {rawText && (
                                    <button
                                        type="button"
                                        onClick={() => setRawText('')}
                                        className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>

                        <textarea
                            rows={16}
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder={`Paste recipe text here...\n\nExample:\nDisplay Name:\nWeight Loss Bhel Puri\nCooking Time:\n20 Mins\n\nIngredients:\nMurmura - 2 cup\nOnion - 1\n\nInstructions:\nTake 2 bowls of murmure.\nMix all ingredients and serve!`}
                            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all placeholder:text-slate-400 font-mono resize-none leading-relaxed"
                            autoFocus
                        />

                        {errorMsg && (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs font-semibold">
                                {errorMsg}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Live Parsed Preview */}
                    <div className="flex flex-col space-y-3">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center justify-between">
                            <span>Live Parsed Preview</span>
                            {parsed.name && (
                                <span className="text-emerald-600 font-bold flex items-center gap-1 normal-case text-xs">
                                    <CheckCircle2 size={13} /> Ready to import
                                </span>
                            )}
                        </label>

                        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 overflow-y-auto max-h-[500px] space-y-5 shadow-inner bg-slate-50/20">
                            {parsed.name || parsed.ingredients.length > 0 || parsed.instructions.length > 0 ? (
                                <>
                                    {/* Name & Meta Badges */}
                                    <div className="border-b border-slate-100 pb-4 space-y-2.5">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                            Recipe Name
                                        </div>
                                        <input
                                            type="text"
                                            value={parsed.name}
                                            onChange={(e) => setParsed({ ...parsed, name: e.target.value })}
                                            placeholder="Enter Recipe Name..."
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-100"
                                        />

                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {parsed.cookingTime && (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                                                    <Clock size={12} /> Cook: {parsed.cookingTime}
                                                </span>
                                            )}
                                            {parsed.totalTime && (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                                                    <Clock size={12} /> Total: {parsed.totalTime}
                                                </span>
                                            )}
                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                                                <Globe size={12} /> {parsed.language || 'English'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Ingredients List with Green Bullets */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                Ingredients ({parsed.ingredients.length})
                                            </div>
                                        </div>
                                        {parsed.ingredients.length > 0 ? (
                                            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
                                                {parsed.ingredients.map((ing, idx) => {
                                                    const isHeader = ing.endsWith(':');
                                                    if (isHeader) {
                                                        return (
                                                            <div key={idx} className="font-bold text-slate-800 text-sm pt-1">
                                                                {ing}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                            <span className="leading-snug">{ing}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No ingredients detected yet</p>
                                        )}
                                    </div>

                                    {/* Instructions List with Green Bullets */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                Instructions ({parsed.instructions.length})
                                            </div>
                                        </div>
                                        {parsed.instructions.length > 0 ? (
                                            <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-100">
                                                {parsed.instructions.map((inst, idx) => {
                                                    const isHeader = inst.endsWith(':');
                                                    if (isHeader) {
                                                        return (
                                                            <div key={idx} className="font-bold text-slate-800 text-sm pt-2">
                                                                {inst}
                                                            </div>
                                                        );
                                                    }
                                                    return (
                                                        <div key={idx} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                                                            <span className="leading-snug">{inst}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No instructions detected yet</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                    <Sparkles size={36} className="text-slate-300 mb-3" />
                                    <p className="text-sm font-bold text-slate-600">No Recipe Text Entered</p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                                        Paste recipe text in the left box or click &ldquo;Load Sample&rdquo; to test automatic parsing.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !parsed.name.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                Saving Recipe...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={16} />
                                Save Recipe
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

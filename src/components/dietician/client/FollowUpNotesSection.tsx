'use client';

import React, { useState, useRef } from 'react';
import { History, Save, Loader2, Bold, Italic } from 'lucide-react';

interface FollowUpNotesSectionProps {
    onSave: (data: { notes: string }) => Promise<void>;
    onShowHistory: () => void;
    isSaving: boolean;
}

export function FollowUpNotesSection({ onSave, onShowHistory, isSaving }: FollowUpNotesSectionProps) {
    const [notes, setNotes] = useState('');
    const editorRef = useRef<HTMLDivElement>(null);

    const handleFormat = (command: string) => {
        document.execCommand(command, false);
        if (editorRef.current) {
            setNotes(editorRef.current.innerHTML);
        }
    };

    const handleSave = async () => {
        const content = editorRef.current?.innerHTML || '';
        const plainText = editorRef.current?.innerText || '';
        if (!plainText.trim()) return;

        await onSave({ notes: content });
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
            setNotes('');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Toolbar & Actions */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); handleFormat('bold'); }}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                        title="Bold"
                    >
                        <Bold size={18} />
                    </button>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); handleFormat('italic'); }}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
                        title="Italic"
                    >
                        <Italic size={18} />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-2" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Follow-up Notes</h3>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !notes.trim() || notes === '<br>'}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Notes
                    </button>
                    <button
                        onClick={onShowHistory}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                        title="View History"
                    >
                        <History size={20} />
                    </button>
                </div>
            </div>

            {/* Rich Text Editor */}
            <div className="p-6 relative min-h-[200px]">
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setNotes(e.currentTarget.innerHTML)}
                    className="w-full min-h-[160px] text-sm text-slate-600 focus:outline-none leading-relaxed prose prose-slate max-w-none"
                    style={{ outline: 'none' }}
                />
                {(!notes || notes === '<br>') && (
                    <div className="absolute top-6 left-6 text-sm text-slate-300 pointer-events-none italic">
                        Write your follow-up notes here. Use bold and italic to highlight important points...
                    </div>
                )}
            </div>
        </div>
    );
}

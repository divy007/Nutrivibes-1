'use client';

import React from 'react';
import { X, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowUpHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    history: any[];
}

export function FollowUpHistoryDrawer({ isOpen, onClose, history }: FollowUpHistoryDrawerProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-[400px] bg-slate-50 shadow-2xl z-[70] overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800">Followup Notes History</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* History List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {history && history.length > 0 ? (
                                [...history].reverse().map((item, index) => (
                                    <div key={item._id || index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {format(new Date(item.date), 'dd MMM yyyy')}
                                                </span>
                                                {item.status === 'DONE' && (
                                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-wider">
                                                <Clock size={10} />
                                                Last Updated At : {format(new Date(item.updatedAt || item.date), 'dd MMM yyyy')}
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div
                                                className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed prose prose-sm max-w-none"
                                                dangerouslySetInnerHTML={{ __html: item.notes }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <div className="p-4 bg-slate-100 rounded-full mb-3">
                                        <Clock size={32} />
                                    </div>
                                    <p className="text-sm font-medium">No history found</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

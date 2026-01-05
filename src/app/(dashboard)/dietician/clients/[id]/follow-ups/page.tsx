'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
    Filter,
    MoreHorizontal,
    Video,
    Plus,
    Calendar,
    Clock,
    CheckCircle2,
    CalendarClock,
    StickyNote,
    Loader2,
    TrendingDown,
    TrendingUp,
    Droplets,
    Zap,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FollowUp {
    _id: string;
    date: string;
    timing: string;
    category: string;
    dieticianId: {
        _id: string;
        name: string;
    };
    meetLink?: string;
    status: 'Pending' | 'Completed' | 'Rescheduled';
    notes?: string;
    summary?: {
        weightDiff: string | null;
        waterConsistency: number | null;
        avgEnergy: string | null;
        logCount: number;
    };
}

const NotesModal = ({ isOpen, onClose, onSave, initialNotes }: { isOpen: boolean, onClose: () => void, onSave: (notes: string) => void, initialNotes: string }) => {
    const [notes, setNotes] = useState(initialNotes);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <StickyNote className="text-orange-500" size={20} /> Add Follow-up Notes
                </h3>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    placeholder="Type follow-up notes here..."
                />
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => onSave(notes)} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-md">Save Notes</button>
                </div>
            </div>
        </div>
    );
};

const RescheduleModal = ({ isOpen, onClose, onSave, initialDate }: { isOpen: boolean, onClose: () => void, onSave: (date: string) => void, initialDate: string }) => {
    const [date, setDate] = useState(initialDate.split('T')[0]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <CalendarClock className="text-blue-500" size={20} /> Reschedule Follow-up
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Date</label>
                        <input
                            type="date"
                            value={date}
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">Cancel</button>
                    <button onClick={() => onSave(date)} className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-md text-center">Confirm Date</button>
                </div>
            </div>
        </div>
    );
};

export default function FollowUpsPage() {
    const params = useParams();
    const clientId = params.id as string;
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeActionId, setActiveActionId] = useState<string | null>(null);

    const [notesModal, setNotesModal] = useState<{ isOpen: boolean, fuId: string | null, notes: string }>({ isOpen: false, fuId: null, notes: '' });
    const [rescheduleModal, setRescheduleModal] = useState<{ isOpen: boolean, fuId: string | null, date: string }>({ isOpen: false, fuId: null, date: '' });

    useEffect(() => {
        const fetchFollowUps = async () => {
            try {
                const data = await api.get<FollowUp[]>(`/api/clients/${clientId}/follow-ups`);
                setFollowUps(data);
            } catch (error) {
                console.error('Failed to fetch follow-ups:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFollowUps();
    }, [clientId]);

    const handleMarkComplete = async (fuId: string) => {
        try {
            const updated = await api.patch<FollowUp>(`/api/clients/${clientId}/follow-ups/${fuId}`, { status: 'Completed' });
            setFollowUps(prev => prev.map(fu => fu._id === fuId ? updated : fu));
        } catch (error) {
            console.error('Failed to mark complete:', error);
            alert('Failed to mark follow-up as complete');
        }
    };

    const handleSaveNotes = async (notes: string) => {
        if (!notesModal.fuId) return;
        try {
            const updated = await api.patch<FollowUp>(`/api/clients/${clientId}/follow-ups/${notesModal.fuId}`, { notes });
            setFollowUps(prev => prev.map(fu => fu._id === notesModal.fuId ? updated : fu));
            setNotesModal({ isOpen: false, fuId: null, notes: '' });
        } catch (error) {
            console.error('Failed to save notes:', error);
            alert('Failed to save notes');
        }
    };

    const handleSaveReschedule = async (date: string) => {
        if (!rescheduleModal.fuId) return;
        try {
            const updated = await api.patch<FollowUp>(`/api/clients/${clientId}/follow-ups/${rescheduleModal.fuId}`, { date, status: 'Rescheduled' });
            setFollowUps(prev => prev.map(fu => fu._id === rescheduleModal.fuId ? updated : fu).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setRescheduleModal({ isOpen: false, fuId: null, date: '' });
        } catch (error) {
            console.error('Failed to reschedule:', error);
            alert('Failed to reschedule');
        }
    };

    const handlePostpone = async (fuId: string, currentDate: string) => {
        try {
            const nextDay = addDays(new Date(currentDate), 1).toISOString();
            const updated = await api.patch<FollowUp>(`/api/clients/${clientId}/follow-ups/${fuId}`, {
                date: nextDay,
                status: 'Rescheduled'
            });
            setFollowUps(prev => prev.map(fu => fu._id === fuId ? updated : fu).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        } catch (error) {
            console.error('Failed to postpone:', error);
            alert('Failed to postpone follow-up');
        }
    };

    const handleSchedule = async () => {
        try {
            const newFollowUp = {
                date: new Date().toISOString(),
                timing: format(new Date(), 'hh:mm a'),
                category: 'Consultation',
                status: 'Pending'
            };
            const created = await api.post<FollowUp>(`/api/clients/${clientId}/follow-ups`, newFollowUp);
            setFollowUps(prev => [created, ...prev]);
        } catch (error) {
            console.error('Failed to schedule:', error);
            alert('Failed to schedule follow-up');
        }
    };

    const toggleActions = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        const stringId = String(id);
        setActiveActionId(activeActionId === stringId ? null : stringId);
    };

    useEffect(() => {
        const closeActions = () => setActiveActionId(null);
        document.addEventListener('click', closeActions);
        return () => document.removeEventListener('click', closeActions);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'text-emerald-500 bg-emerald-50';
            case 'Pending': return 'text-amber-500 bg-amber-50';
            case 'Rescheduled': return 'text-blue-500 bg-blue-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-800">Follow Ups</h1>
                <button
                    onClick={handleSchedule}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Schedule Follow-up
                </button>
            </div>

            {/* Filters Row */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search date..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors ml-auto">
                    <Filter size={16} />
                    Advanced Filters
                </button>
            </div>

            {/* Timeline View */}
            <div className="relative pl-8 ml-4">
                {/* Vertical Line */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100 rounded-full" />

                <div className="space-y-12">
                    {followUps.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 italic bg-white rounded-xl border border-dashed border-slate-200">
                            No follow-ups found for this client.
                        </div>
                    ) : (
                        followUps.map((fu, index) => {
                            const isPast = isBefore(new Date(fu.date), startOfDay(new Date())) && fu.status === 'Pending';
                            const isToday = format(new Date(fu.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

                            return (
                                <motion.div
                                    key={fu._id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative"
                                >
                                    {/* Timeline Dot */}
                                    <div className={`absolute -left-[36px] top-6 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10 ${fu.status === 'Completed' ? 'bg-emerald-500' :
                                        isPast ? 'bg-rose-500' :
                                            isToday ? 'bg-orange-500' : 'bg-slate-300'
                                        }`} />

                                    {/* Card */}
                                    <div className={`bg-white rounded-2xl border transition-all duration-300 ${isPast ? 'border-rose-100 shadow-rose-50/50' :
                                        isToday ? 'border-orange-100 shadow-orange-50/50 scale-[1.02]' :
                                            'border-slate-100 shadow-sm'
                                        } p-6 shadow-xl`}>
                                        <div className="flex flex-col lg:flex-row gap-6">
                                            {/* LEFT: Timing & Status */}
                                            <div className="lg:w-48 space-y-2">
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Calendar size={14} />
                                                    <span className="text-xs font-bold uppercase tracking-widest">
                                                        {format(new Date(fu.date), 'dd MMM yyyy')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock size={14} />
                                                    <span className="text-sm font-black text-slate-700">{fu.timing}</span>
                                                </div>
                                                <div className="pt-2">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(fu.status)}`}>
                                                        {fu.status}
                                                    </span>
                                                    {isPast && (
                                                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                                            <AlertCircle size={10} /> Overdue
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* CENTER: Details & Talking Points */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                            Month {index + 1}: {fu.category}
                                                        </h3>
                                                        <p className="text-xs text-slate-500 font-medium">Coach: {fu.dieticianId?.name || 'Assigned Coach'}</p>
                                                    </div>

                                                    {fu.meetLink && fu.status !== 'Completed' && (
                                                        <a href={fu.meetLink} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all shadow-md group">
                                                            <Video size={16} />
                                                            Join Call
                                                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                                        </a>
                                                    )}
                                                </div>

                                                {fu.notes && (
                                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                                        <p className="text-xs text-slate-600 italic">"{fu.notes}"</p>
                                                    </div>
                                                )}

                                                {/* SMART TALKING POINTS */}
                                                {fu.summary && fu.summary.logCount > 0 && (
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                                                        {/* Weight Diff */}
                                                        {fu.summary.weightDiff !== null && (
                                                            <div className={`p-3 rounded-xl border ${Number(fu.summary.weightDiff) <= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {Number(fu.summary.weightDiff) <= 0 ? <TrendingDown size={14} className="text-emerald-500" /> : <TrendingUp size={14} className="text-rose-500" />}
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weight Change</span>
                                                                </div>
                                                                <span className={`text-sm font-black ${Number(fu.summary.weightDiff) <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                                    {Number(fu.summary.weightDiff) > 0 ? '+' : ''}{fu.summary.weightDiff}kg
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Water consistency */}
                                                        {fu.summary.waterConsistency !== null && (
                                                            <div className={`p-3 rounded-xl border ${fu.summary.waterConsistency >= 80 ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100'}`}>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Droplets size={14} className="text-blue-500" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hydration</span>
                                                                </div>
                                                                <span className="text-sm font-black text-slate-700">{fu.summary.waterConsistency}% consistency</span>
                                                            </div>
                                                        )}

                                                        {/* Avg Energy */}
                                                        {fu.summary.avgEnergy !== null && (
                                                            <div className={`p-3 rounded-xl border ${Number(fu.summary.avgEnergy) >= 3 ? 'bg-brand-sage/10 border-brand-sage/20' : 'bg-rose-50 border-rose-100'}`}>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <Zap size={14} className="text-brand-sage" />
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Energy Level</span>
                                                                </div>
                                                                <span className="text-sm font-black text-slate-700">{fu.summary.avgEnergy}/5 avg</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* RIGHT: Actions */}
                                            <div className="flex lg:flex-col gap-2 justify-end">
                                                {fu.status !== 'Completed' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMarkComplete(fu._id)}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors flex items-center justify-center"
                                                            title="Mark Complete"
                                                        >
                                                            <CheckCircle2 size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePostpone(fu._id, fu.date)}
                                                            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center"
                                                            title="Postpone to Tomorrow"
                                                        >
                                                            <Clock size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => setRescheduleModal({ isOpen: true, fuId: fu._id, date: fu.date })}
                                                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center"
                                                            title="Reschedule"
                                                        >
                                                            <CalendarClock size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setNotesModal({ isOpen: true, fuId: fu._id, notes: fu.notes || '' })}
                                                    className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center"
                                                    title="Add Notes"
                                                >
                                                    <StickyNote size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>

            <NotesModal
                isOpen={notesModal.isOpen}
                onClose={() => setNotesModal({ ...notesModal, isOpen: false })}
                onSave={handleSaveNotes}
                initialNotes={notesModal.notes}
            />

            <RescheduleModal
                isOpen={rescheduleModal.isOpen}
                onClose={() => setRescheduleModal({ ...rescheduleModal, isOpen: false })}
                onSave={handleSaveReschedule}
                initialDate={rescheduleModal.date}
            />
        </div>
    );
}

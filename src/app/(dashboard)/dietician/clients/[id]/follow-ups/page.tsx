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
    Loader2
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';

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
            setFollowUps(prev => prev.map(fu => fu._id === rescheduleModal.fuId ? updated : fu));
            setRescheduleModal({ isOpen: false, fuId: null, date: '' });
        } catch (error) {
            console.error('Failed to reschedule:', error);
            alert('Failed to reschedule');
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

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">S.No</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timing</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Assigned Coach</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Join Meet</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 min-h-[200px]">
                            {followUps.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                                        No follow-ups found for this client.
                                    </td>
                                </tr>
                            ) : (
                                followUps.map((fu, index) => (
                                    <tr key={fu._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-xs font-bold text-slate-400 text-center">{index + 1}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                                            {format(new Date(fu.date), 'dd-MMM-yyyy')}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-slate-600 uppercase italic underline underline-offset-4 decoration-slate-200 decoration-1">
                                            {fu.timing}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            <div className="flex flex-col gap-0.5">
                                                <span>{fu.category}</span>
                                                {fu.notes && (
                                                    <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px] flex items-center gap-1">
                                                        <StickyNote size={10} /> {fu.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            {fu.dieticianId?.name || 'Assigned Coach'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {fu.meetLink ? (
                                                <a href={fu.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                                                    <Video size={16} />
                                                </a>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(fu.status)}`}>
                                                {fu.status}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-center relative ${activeActionId === String(fu._id) ? 'z-50' : 'z-0'}`}>
                                            <button
                                                onClick={(e) => toggleActions(e, fu._id)}
                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {activeActionId === String(fu._id) && (
                                                <div className="absolute right-4 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-[60] overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
                                                    <button
                                                        onClick={() => setNotesModal({ isOpen: true, fuId: fu._id, notes: fu.notes || '' })}
                                                        className="w-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 transition-colors"
                                                    >
                                                        <StickyNote size={14} className="text-orange-500" />
                                                        Add Notes
                                                    </button>
                                                    <button
                                                        onClick={() => setRescheduleModal({ isOpen: true, fuId: fu._id, date: fu.date })}
                                                        className="w-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-b border-slate-50 transition-colors"
                                                    >
                                                        <CalendarClock size={14} className="text-blue-500" />
                                                        Reschedule
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkComplete(fu._id)}
                                                        className="w-full px-4 py-2.5 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                        Mark as complete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Mock) */}
                <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-100 flex items-center justify-end gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        Items per page:
                        <span className="flex items-center gap-1 border-b border-slate-300 pb-0.5 cursor-pointer text-slate-700">
                            10 <Clock size={10} className="rotate-180" />
                        </span>
                    </div>
                    <div className="text-slate-500">
                        {followUps.length > 0 ? `1 - ${followUps.length} of ${followUps.length}` : '0 of 0'}
                    </div>
                    <div className="flex items-center gap-4 text-slate-300">
                        <span className="cursor-not-allowed">{'|<'}</span>
                        <span className="cursor-not-allowed">{'<'}</span>
                        <span className="cursor-not-allowed">{'>'}</span>
                        <span className="cursor-not-allowed">{'>|'}</span>
                    </div>
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

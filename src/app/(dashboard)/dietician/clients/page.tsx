'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Search, Loader2, MoreHorizontal, Filter, ChevronDown, Calendar, PauseCircle, Trash2, PlayCircle, Phone } from 'lucide-react';
import { ClientInfo } from '@/types';

const PauseModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (date: string) => void }) => {
    const [date, setDate] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Pause Client</h3>
                <p className="text-sm text-slate-500 mb-6">Select a date until which the client will be paused.</p>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Pause Until</label>
                    <input
                        type="date"
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (!date) return alert('Please select a date');
                            onConfirm(date);
                        }}
                        className="flex-1 px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors shadow-md"
                    >
                        Confirm Pause
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function ClientsPage() {
    const searchParams = useSearchParams();
    const initialStatus = searchParams.get('status') || 'ACTIVE';
    const initialSearch = searchParams.get('q') || '';

    const [clients, setClients] = useState<ClientInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    useEffect(() => {
        const status = searchParams.get('status');
        if (status) {
            setStatusFilter(status);
        }
        const q = searchParams.get('q');
        if (q !== null) {
            setSearchTerm(q);
        }
    }, [searchParams]);
    const [pauseModalState, setPauseModalState] = useState<{ isOpen: boolean, clientId: string | null }>({ isOpen: false, clientId: null });

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await api.get<any[]>('/api/clients');
                const enhancedData = data.map((c) => ({
                    ...c,
                    clientId: c.clientId || `#${c._id.slice(-8)}`,
                    country: c.country || c.state || '-',
                    timeZone: c.timeZone || '',
                }));
                setClients(enhancedData);
            } catch (error) {
                console.error('Failed to fetch clients:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, []);

    const filteredClients = clients.filter(client => {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch =
            client.name.toLowerCase().includes(lowerSearch) ||
            (client.email || '').toLowerCase().includes(lowerSearch) ||
            (client.phone || '').includes(searchTerm) ||
            (client.clientId || '').toLowerCase().includes(lowerSearch);

        if (!matchesSearch) return false;

        // Status Filtering
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'NEW') {
            // New means created in last 7 days
            if (!client.createdAt) return false;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(client.createdAt) >= sevenDaysAgo;
        }

        if (statusFilter === 'FOLLOWUP_TODAY') {
            return !!client.hasFollowUpToday;
        }

        if (statusFilter === 'FOLLOW_UPS') {
            return !!client.hasFollowUpToday;
        }

        if (statusFilter === 'NEEDS_DIET') {
            return client.dietStatus === 'black';
        }

        if (statusFilter === 'LEADS') {
            return client.registrationSource === 'MOBILE_APP' && !client.isProfileComplete;
        }

        return client.status === statusFilter;
    }).sort((a, b) => {
        const priority = { black: 0, red: 1, yellow: 2, green: 3 };
        const aStatus = (a.dietStatus as keyof typeof priority) || 'green';
        const bStatus = (b.dietStatus as keyof typeof priority) || 'green';

        if (priority[aStatus] !== priority[bStatus]) {
            return priority[aStatus] - priority[bStatus];
        }
        return a.name.localeCompare(b.name);
    });

    const getDietStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'bg-emerald-500';
            case 'red': return 'bg-rose-500';
            case 'yellow': return 'bg-amber-500';
            case 'black': return 'bg-slate-900';
            default: return 'bg-slate-300';
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return { label: 'Active', color: 'text-emerald-600', dot: 'bg-emerald-500' };
            case 'NEW':
                return { label: 'New', color: 'text-blue-600', dot: 'bg-blue-500' };
            case 'INACTIVE':
                return { label: 'Inactive', color: 'text-slate-500', dot: 'bg-slate-400' };
            case 'PAUSED':
                return { label: 'Paused', color: 'text-amber-600', dot: 'bg-amber-500' };
            case 'DELETED':
                return { label: 'Deleted', color: 'text-rose-900', dot: 'bg-rose-800' };
            case 'LEAD':
                return { label: 'Lead', color: 'text-orange-600', dot: 'bg-orange-500' };
            default:
                if (!status && initialStatus === 'LEADS') return { label: 'Lead', color: 'text-orange-600', dot: 'bg-orange-500' };
                return { label: status || 'Unknown', color: 'text-slate-400', dot: 'bg-slate-300' };
        }
    };

    // Helper to get status for the tag specifically
    const getClientDisplayStatus = (client: ClientInfo) => {
        if (client.registrationSource === 'MOBILE_APP' && !client.isProfileComplete) return 'LEAD';
        return client.status;
    };

    const handleRowClick = (clientId: string) => {
        window.open(`/dietician/clients/${clientId}`, '_blank');
    };

    const handleDelete = async (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this client? This action cannot be undone and they will not be able to login again.')) {
            try {
                await api.del(`/api/clients/${clientId}`);
                setClients(prev => prev.filter(c => c._id !== clientId));
            } catch (error: any) {
                console.error('Failed to delete client:', error);
                alert(error.message || 'Failed to delete client');
            }
        }
    };

    const handlePause = async (e: React.MouseEvent, clientId: string, currentStatus: string) => {
        e.stopPropagation();

        if (currentStatus === 'PAUSED') {
            // Resume immediately
            try {
                await api.patch(`/api/clients/${clientId}`, { status: 'ACTIVE', pausedUntil: null });
                setClients(prev => prev.map(c => c._id === clientId ? { ...c, status: 'ACTIVE', pausedUntil: undefined } : c));
            } catch (error) {
                console.error('Failed to resume client:', error);
                alert('Failed to resume client');
            }
        } else {
            // Open modal to select date
            setPauseModalState({ isOpen: true, clientId });
        }
    };

    const handleConfirmPause = async (date: string) => {
        const clientId = pauseModalState.clientId;
        if (!clientId) return;

        try {
            await api.patch(`/api/clients/${clientId}`, { status: 'PAUSED', pausedUntil: date });
            setClients(prev => prev.map(c => c._id === clientId ? { ...c, status: 'PAUSED', pausedUntil: date } : c));
            setPauseModalState({ isOpen: false, clientId: null });
        } catch (error) {
            console.error('Failed to pause client:', error);
            alert('Failed to pause client');
        }
    };

    const [activeActionId, setActiveActionId] = useState<string | null>(null);

    const toggleActions = (e: React.MouseEvent, clientId: string) => {
        e.stopPropagation();
        e.nativeEvent.stopImmediatePropagation();
        setActiveActionId(activeActionId === clientId ? null : clientId);
    };

    useEffect(() => {
        const handleClickOutside = () => setActiveActionId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="p-6 bg-[#FAF9F6] min-h-full">
            <div className="max-w-[1600px] mx-auto bg-white rounded-[32px] soft-shadow border border-slate-100 overflow-hidden">
                {/* Header Section */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
                    <h1 className="text-2xl font-black text-brand-forest">Manage Members</h1>
                </div>

                {/* Filters Section */}
                <div className="p-6 border-b border-slate-100 flex flex-col gap-6">
                    {/* Search Bar & Legend */}
                    <div className="flex items-center justify-between gap-6">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by ID, Name, Contact..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-sage/20 focus:border-brand-sage bg-slate-50/50 transition-all shadow-inner"
                            />
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                                <Filter size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Diet Legend:</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                                    <span className="text-[10px] font-bold text-slate-500">Urgent</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <span className="text-[10px] font-bold text-slate-500">Tomorrow</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                    <span className="text-[10px] font-bold text-slate-500">48h</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-bold text-slate-500">72h+</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Toggle Area */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status: {statusFilter}</span>
                        <div className="flex items-center gap-2">
                            {/* Filter Chips - Could expand this later */}
                            {(['ACTIVE', 'PAUSED', 'DELETED', 'NEW', 'LEADS', 'NEEDS_DIET', 'FOLLOW_UPS'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                                        ? 'bg-brand-sage text-white border-brand-sage shadow-md'
                                        : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                >
                                    {status === 'NEW' ? 'New (7 Days)' :
                                        status === 'LEADS' ? 'Leads (Incomplete)' :
                                            status === 'NEEDS_DIET' ? 'Needs Diet Today' :
                                                status === 'FOLLOW_UPS' ? 'Follow-ups Today' :
                                                    status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}

                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('ALL');
                                }}
                                className="ml-auto px-4 py-1.5 text-sm text-slate-500 hover:text-orange-600 underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                {loading ? (
                    <div className="p-20 flex justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <div className="overflow-visible">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30 border-b border-slate-50">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">#ID</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Country/Time Zone</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Plan Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Diet</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Topic</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredClients.map((client) => (
                                    <tr
                                        key={client._id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                        onClick={() => handleRowClick(client._id)}
                                    >
                                        <td className="px-6 py-4 text-xs font-bold text-slate-500 text-center">
                                            {client.clientId}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="font-bold text-slate-700 text-sm group-hover:text-brand-forest transition-colors">
                                                    {client.name}
                                                </span>
                                                {client.phone && (
                                                    <a
                                                        href={`tel:${client.phone}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1.5 bg-brand-sage/10 text-brand-sage rounded-full hover:bg-brand-sage hover:text-white transition-all shadow-sm"
                                                        title="Call Client"
                                                    >
                                                        <Phone size={14} />
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                            {client.country} {client.timeZone}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const styles = getStatusStyles(getClientDisplayStatus(client) || 'ACTIVE');
                                                const isMobile = client.registrationSource === 'MOBILE_APP';
                                                return (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold ${styles.color} rounded`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                                                            {styles.label}
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-400 tracking-tighter uppercase">
                                                            via {isMobile ? 'Mobile' : 'Dietician'}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        {/* Removed Plan Column */}
                                        <td className="px-6 py-4 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ${getDietStatusColor(client.dietStatus || '')}`}></div>
                                        </td>
                                        <td className={`px-6 py-4 text-center relative ${activeActionId === client._id ? 'z-50' : 'z-0'}`}>
                                            <button
                                                onClick={(e) => toggleActions(e, client._id)}
                                                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {/* Action Dropdown */}
                                            {activeActionId === client._id && (
                                                <div className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-xl border border-slate-100 z-50 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100">
                                                    <button
                                                        onClick={(e) => handlePause(e, client._id, client.status || 'ACTIVE')}
                                                        className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-50"
                                                    >
                                                        {client.status === 'PAUSED' ? (
                                                            <>
                                                                <PlayCircle size={14} className="text-emerald-500" />
                                                                <span>Resume</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <PauseCircle size={14} className="text-amber-500" />
                                                                <span>Pause</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, client._id)}
                                                        className="w-full px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {client.hasFollowUpToday ? (
                                                <button className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 flex items-center justify-center gap-1 mx-auto animate-pulse">
                                                    FOLLOWUP DUE
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center block">
                                                    -
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination (Mock) */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                        Items per page:
                        <span className="flex items-center gap-1 border-b border-slate-300 pb-0.5 cursor-pointer">
                            10 <ChevronDown size={10} />
                        </span>
                    </div>
                    <div>1 - {clients.length} of {clients.length}</div>
                    <div className="flex items-center gap-4">
                        <button className="opacity-30 cursor-not-allowed">{'| <'}</button>
                        <button className="opacity-30 cursor-not-allowed">{'<'}</button>
                        <button className="hover:text-orange-500">{'>'}</button>
                        <button className="hover:text-orange-500">{'> |'}</button>
                    </div>
                </div>
            </div>

            <PauseModal
                isOpen={pauseModalState.isOpen}
                onClose={() => setPauseModalState({ isOpen: false, clientId: null })}
                onConfirm={handleConfirmPause}
            />
        </div >
    );
}

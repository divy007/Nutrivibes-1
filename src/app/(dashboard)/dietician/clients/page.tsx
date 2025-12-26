'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { Search, Loader2, MoreHorizontal, Filter, ChevronDown, Calendar } from 'lucide-react';

interface Client {
    _id: string;
    clientId?: string; // e.g. #492269164
    name: string;
    email: string;
    status: string;
    country?: string;
    timeZone?: string;
    plan?: string;
    dietStatus?: 'green' | 'red' | 'yellow';
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Active');

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const data = await api.get<any[]>('/api/clients');
                // Map real data and add some mock fields for the Fitelo UI demo
                const enhancedData = data.map((c, i) => ({
                    ...c,
                    clientId: c.clientId || `#${Math.floor(100000000 + Math.random() * 900000000)}`,
                    country: c.country || 'India',
                    timeZone: c.timeZone || '(26 Dec, 12:35 PM)',
                    plan: c.plan || 'Cure & Reverse - 12 Months',
                    dietStatus: ['green', 'red', 'yellow'][Math.floor(Math.random() * 3)] as any,
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

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getDietStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'bg-emerald-500';
            case 'red': return 'bg-rose-500';
            case 'yellow': return 'bg-amber-500';
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
            default:
                return { label: status || 'Unknown', color: 'text-slate-400', dot: 'bg-slate-300' };
        }
    };

    const handleRowClick = (clientId: string) => {
        window.open(`/dietician/clients/${clientId}`, '_blank');
    };

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h1 className="text-xl font-bold text-slate-800">Manage Member's</h1>
                </div>

                {/* Filters Section */}
                <div className="p-6 border-b border-slate-100 flex flex-col gap-6">
                    {/* Search Bar */}
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search by ID, Name, Contact..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-slate-50 shadow-inner"
                            />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Filter size={16} />
                            </button>
                        </div>
                        <div className="ml-auto text-slate-500 text-sm">
                            <span className="border border-slate-200 px-4 py-2 rounded bg-white flex items-center gap-2">
                                26/12/2025 <Calendar size={14} />
                            </span>
                        </div>
                    </div>

                    {/* Status Toggle Area */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded text-sm text-orange-600 font-semibold cursor-pointer">
                                Active <span className="text-xs">×</span>
                            </div>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="px-6 py-1.5 border border-orange-200 text-sm text-orange-600 font-semibold rounded hover:bg-orange-50 transition-colors"
                            >
                                Reset
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">#ID</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Country/Time Zone</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Plan Status <Filter size={10} className="inline ml-1 text-orange-400" /></th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Plan</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Diet <Filter size={10} className="inline ml-1 text-orange-400" /></th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Topic <Filter size={10} className="inline ml-1 text-orange-400" /></th>
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
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-slate-700 text-sm group-hover:text-orange-600 transition-colors">
                                                    {client.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-600 font-medium">
                                            {client.country} {client.timeZone}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(() => {
                                                const styles = getStatusStyles(client.status);
                                                return (
                                                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold ${styles.color} rounded`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`}></span>
                                                        {styles.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                                            {client.plan}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ${getDietStatusColor(client.dietStatus || '')}`}></div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-slate-400 hover:text-slate-600">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button className="text-[10px] font-bold text-amber-500 uppercase tracking-widest hover:text-amber-600 flex items-center justify-center gap-1 mx-auto">
                                                FOLLOWUP <ChevronDown size={12} className="-rotate-90" />
                                            </button>
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
                    <div>1 - 10 of 58</div>
                    <div className="flex items-center gap-4">
                        <button className="opacity-30 cursor-not-allowed">{'| <'}</button>
                        <button className="opacity-30 cursor-not-allowed">{'<'}</button>
                        <button className="hover:text-orange-500">{'>'}</button>
                        <button className="hover:text-orange-500">{'> |'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

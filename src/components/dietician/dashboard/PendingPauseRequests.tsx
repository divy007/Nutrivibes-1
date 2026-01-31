'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface PauseRequest {
    _id: string;
    clientId: string;
    clientName: string;
    clientImage?: string;
    planName: string;
    requestDate: string;
    startDate: string;
    durationDays: number;
    reason?: string;
}

export default function PendingPauseRequests() {
    const [requests, setRequests] = useState<PauseRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            const data = await api.get<PauseRequest[]>('/api/dietician/pause-requests');
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch pause requests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        // Poll every 30 seconds for new requests? Or just once on load.
        // Let's stick to load for now to avoid complexity.
    }, []);

    const handleAction = async (requestId: string, clientId: string, action: 'APPROVE' | 'REJECT') => {
        if (!confirm(`Are you sure you want to ${action.toLowerCase()} this request?`)) return;

        setProcessingId(requestId);
        try {
            await api.patch('/api/dietician/pause-requests', {
                clientId,
                requestId,
                action
            });
            // Refresh list
            fetchRequests();
        } catch (error) {
            console.error(`Failed to ${action} request:`, error);
            alert(`Failed to ${action} request`);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return null; // Or show skeleton. Returning null avoids layout shift if empty primarily.
    if (requests.length === 0) return null; // Don't show if empty

    return (
        <div className="bg-white rounded-[24px] border border-slate-100 p-6 soft-shadow mb-6 border-l-4 border-l-amber-400">
            <h3 className="text-sm font-black text-brand-sage mb-4 flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Pending Pause Requests
                <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full">{requests.length} New</span>
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                        <tr>
                            <th className="py-2 px-2">Client</th>
                            <th className="py-2 px-2">Plan</th>
                            <th className="py-2 px-2">Start Date</th>
                            <th className="py-2 px-2">Duration</th>
                            <th className="py-2 px-2">Reason</th>
                            <th className="py-2 px-2 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {requests.map((req) => (
                            <tr key={req._id} className="hover:bg-slate-50/50">
                                <td className="py-3 px-2 font-bold text-slate-700">{req.clientName}</td>
                                <td className="py-3 px-2 text-slate-600 text-xs">{req.planName}</td>
                                <td className="py-3 px-2 text-slate-600 font-medium">
                                    {format(new Date(req.startDate), 'dd MMM yyyy')}
                                </td>
                                <td className="py-3 px-2 text-slate-600 font-medium">{req.durationDays} Days</td>
                                <td className="py-3 px-2 text-slate-500 italic text-xs truncate max-w-[150px]">{req.reason || 'No reason provided'}</td>
                                <td className="py-3 px-2 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleAction(req._id, req.clientId, 'APPROVE')}
                                            disabled={processingId === req._id}
                                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors disabled:opacity-50"
                                            title="Approve"
                                        >
                                            {processingId === req._id ? <Loader2 size={16} className="animate-spin" /> : <div className="flex items-center gap-1"><CheckCircle size={16} /><span className="text-xs font-bold">Approve</span></div>}
                                        </button>
                                        <button
                                            onClick={() => handleAction(req._id, req.clientId, 'REJECT')}
                                            disabled={processingId === req._id}
                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors disabled:opacity-50"
                                            title="Reject"
                                        >
                                            {processingId === req._id ? <Loader2 size={16} className="animate-spin" /> : <div className="flex items-center gap-1"><XCircle size={16} /><span className="text-xs font-bold">Reject</span></div>}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Loader2, Key, Trash2, Pencil, Plus, Info, ChevronRight, User } from 'lucide-react';

interface Client {
    _id: string;
    clientId?: string;
    name: string;
    email: string;
    phone?: string;
    dob?: string;
    gender?: string;
    city?: string;
    state?: string;
    height?: number;
    weight?: number;
    status: string;
    preferences?: string;
}

import { useClientData } from '@/context/ClientDataContext';

export default function ClientProfilePage() {
    const { clientInfo: client, loading, refreshClient } = useClientData();
    const router = useRouter();

    // Existing security states
    const [showReset, setShowReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!client) return;
        setResetLoading(true);
        try {
            await api.patch(`/api/clients/${client.id}/password`, { password: newPassword });
            setShowReset(false);
            setNewPassword('');
        } catch (err) {
            alert('Failed to reset password');
        } finally {
            setResetLoading(false);
        }
    };

    const handleDeleteClient = async () => {
        if (!client) return;
        setDeleteLoading(true);
        try {
            await api.del(`/api/clients/${client.id}`);
            router.push('/dietician/clients');
        } catch (err) {
            alert('Failed to delete client');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
    if (!client) return <div className="p-8">Client not found</div>;

    const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Basic Info & Metrics */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic Summary Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-2xl border-2 border-white shadow-sm ring-1 ring-orange-200 font-serif">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-800">{client.name}</h2>
                            <p className="text-sm text-slate-400 font-medium">{client.id}</p>
                            <div className="mt-4 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Ovo Vegetarian</span>
                                <div className="mt-2">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">Opted Live Session</span>
                                </div>
                                <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">N/A</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button className="text-orange-500 hover:bg-orange-50 p-1 rounded transition-colors">
                                <Pencil size={16} />
                            </button>
                            <span className="text-[10px] font-bold text-slate-300">UK</span>
                            <div className="mt-auto">
                                <span className="text-xs font-bold text-slate-400">Reading</span>
                            </div>
                        </div>
                    </div>

                    {/* BMI & Weight Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* BMI Card */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">BMI</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center text-emerald-500">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-700">18.5 - 24.9</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ideal Range</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center text-blue-500">
                                        <Activity size={20} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-700">
                                            {(() => {
                                                if (client.height && client.weight) {
                                                    const h = client.height / 100;
                                                    return (client.weight / (h * h)).toFixed(1);
                                                }
                                                return 'N/A';
                                            })()}
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current BMI</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Weight Card */}
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Weight</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 rounded flex items-center justify-center text-indigo-500">
                                        <Utensils size={20} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-700">N/A</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Target Weight</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-rose-50 rounded flex items-center justify-center text-rose-500">
                                        <Utensils size={20} />
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold text-slate-700">{client.weight ? `${client.weight} Kg` : 'N/A'}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Weight</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical Conditions */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Medical Condition</h3>
                        <div className="flex flex-wrap gap-2">
                            {['Thyroid', 'Diabetes / Pre-Diabetes', 'Cholesterol', 'PCOD / PCOS'].map(tag => (
                                <span key={tag} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${tag === 'Thyroid' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Goals Section */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Goals</h3>
                        <div className="py-8 text-center bg-slate-50/50 rounded border border-dashed border-slate-200">
                            <span className="text-rose-400 text-xs font-bold">No Goal Found!</span>
                        </div>
                    </div>

                    {/* Link Profile Section */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Link Profile</h3>
                            <button className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 rounded hover:bg-slate-200">
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="py-4 text-center bg-slate-50/50 rounded border border-slate-100">
                            <span className="text-slate-400 text-xs font-medium">No Members linked to this account</span>
                        </div>
                    </div>

                    {/* Security & Danger Zone (Existing functionalities) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg border border-slate-200 p-6">
                            <div className="flex items-center gap-2 mb-4 text-[#1b4332]">
                                <Key className="w-5 h-5 text-orange-500" />
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Security</h3>
                            </div>
                            {!showReset ? (
                                <button onClick={() => setShowReset(true)} className="w-full py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded hover:bg-slate-50">Reset Password</button>
                            ) : (
                                <form onSubmit={handlePasswordReset} className="flex gap-2">
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-orange-500" placeholder="New Password" />
                                    <button type="submit" disabled={resetLoading} className="px-4 py-2 bg-slate-800 text-white text-[10px] font-bold rounded uppercase tracking-widest">{resetLoading ? '...' : 'Save'}</button>
                                </form>
                            )}
                        </div>
                        <div className="bg-white rounded-lg border border-red-100 p-6">
                            <div className="flex items-center gap-2 mb-4 text-red-600">
                                <Trash2 className="w-5 h-5" />
                                <h3 className="text-xs font-bold text-red-600 uppercase tracking-widest">Danger Zone</h3>
                            </div>
                            {!showDeleteConfirm ? (
                                <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2 border border-red-200 text-xs font-bold text-red-600 rounded hover:bg-red-50">Delete Client</button>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[10px] text-red-600 font-bold">Are you sure?</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-1.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded uppercase">Cancel</button>
                                        <button onClick={handleDeleteClient} disabled={deleteLoading} className="flex-1 py-1.5 bg-red-600 text-[10px] font-bold text-white rounded uppercase">{deleteLoading ? '...' : 'Confirm'}</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Persona */}
                <div className="space-y-6">

                    {/* Persona Details Card */}
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Persona Details</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Persona</h4>
                                <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold">
                                    <div className="w-4 h-4 rounded-sm border border-emerald-200 flex items-center justify-center bg-emerald-50">
                                        <ChevronRight size={10} className="rotate-45" />
                                    </div>
                                    Want To Lose Weight
                                </div>
                            </div>
                            {['Diet', 'Mind', 'Yoga', 'Exercise'].map(type => (
                                <div key={type}>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{type} Language</h4>
                                    <span className="text-xs font-bold text-rose-400">N/A</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// Re-using some icons for consistent look
const Activity = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
);
const Utensils = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></svg>
);

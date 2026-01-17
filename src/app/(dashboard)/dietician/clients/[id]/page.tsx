'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Loader2, Key, Trash2, Pencil, Plus, ChevronRight, Activity, Utensils } from 'lucide-react';

import { useClientData } from '@/context/ClientDataContext';
import { SymptomHistory } from '@/components/dietician/client/SymptomHistory';

export default function ClientSummaryPage() {
    const { clientInfo: client, loading, refreshClient } = useClientData();
    const router = useRouter();

    // Existing security states
    const [showReset, setShowReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Symptom state
    const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
    const [symptomsLoading, setSymptomsLoading] = useState(true);

    useEffect(() => {
        const fetchSymptoms = async () => {
            if (!client?._id) return;
            try {
                const data = await api.get<any[]>(`/api/clients/${client._id}/symptom-logs`);
                setSymptomLogs(data);
            } catch (err) {
                console.error('Failed to fetch symptoms:', err);
            } finally {
                setSymptomsLoading(false);
            }
        };
        fetchSymptoms();
    }, [client?._id]);

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
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{client.preferences || 'No Preferences Set'}</span>
                                {client.primaryGoal && (
                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest leading-none mt-1">Goal: {client.primaryGoal}</span>
                                )}
                                <div className="mt-2">
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-tighter">{client.status}</span>
                                </div>
                                <span className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{client.phone || 'No Phone'}</span>
                                {client.age !== undefined && (
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest"> • {client.age} Years Old</span>
                                )}
                                {client.dob && (
                                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mt-0.5">DOB: {new Date(client.dob).toLocaleDateString()}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button onClick={() => router.push(`/dietician/clients/${client._id}/profile/edit`)} className="text-orange-500 hover:bg-orange-50 p-1 rounded transition-colors">
                                <Pencil size={16} />
                            </button>
                            <span className="text-[10px] font-bold text-slate-300">{client.state || 'N/A'}</span>
                            <div className="mt-auto">
                                <span className="text-xs font-bold text-slate-400">{client.city || 'N/A'}</span>
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
                                        <div className="text-lg font-bold text-slate-700">{client.idealWeight ? `${client.idealWeight} Kg` : 'N/A'}</div>
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
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dietary Preferences / Conditions</h3>
                        <div className="flex flex-wrap gap-2">
                            {client.preferences && client.preferences !== 'N/A' ? (
                                client.preferences.split(',').map(tag => (
                                    <span key={tag} className="px-3 py-1 rounded-full text-[10px] font-bold border bg-emerald-50 border-emerald-200 text-emerald-600">
                                        {tag.trim()}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400 italic">No conditions or preferences listed</span>
                            )}
                        </div>
                    </div>

                    {/* Symptom History Section */}
                    <SymptomHistory logs={symptomLogs} />

                    {/* Goals Section */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Detailed Goals</h3>

                        {(client.counsellingProfile?.medicalGoal || client.counsellingProfile?.loseWeightReasons?.length > 0) ? (
                            <div className="space-y-4">
                                {client.counsellingProfile?.medicalGoal && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Medical Goal</h4>
                                        <p className="text-sm font-medium text-slate-700">{client.counsellingProfile.medicalGoal}</p>
                                    </div>
                                )}

                                {client.counsellingProfile?.loseWeightReasons && client.counsellingProfile.loseWeightReasons.length > 0 && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Motivations</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {client.counsellingProfile.loseWeightReasons.map((reason: string, idx: number) => (
                                                <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">
                                                    {reason}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-50/50 rounded border border-dashed border-slate-200">
                                <span className="text-slate-400 text-xs font-medium">No detailed goals recorded</span>
                            </div>
                        )}
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
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Assessment Profile</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Overall Risk Level</h4>
                                <div className={`flex items-center gap-2 ${client.assessment ? 'text-emerald-600' : 'text-slate-400'} text-xs font-bold`}>
                                    <div className={`w-4 h-4 rounded-sm border ${client.assessment ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'} flex items-center justify-center`}>
                                        <ChevronRight size={10} className="rotate-45" />
                                    </div>
                                    {client.assessment?.riskLevel || 'Assessment Pending'}
                                </div>
                            </div>

                            {[
                                { key: 'eat', label: 'Diet Performance' },
                                { key: 'lifestyle', label: 'Lifestyle Score' },
                                { key: 'mind', label: 'Mental Wellness' },
                                { key: 'exercise', label: 'Physical Activity' }
                            ].map(item => {
                                const score = client.assessment?.categoryScores?.[item.key as keyof typeof client.assessment.categoryScores];
                                return (
                                    <div key={item.key}>
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</h4>
                                        <span className={`text-xs font-bold ${score !== undefined ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            {score !== undefined ? `${score}/10` : 'No Data'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

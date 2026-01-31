'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Loader2, Key, Trash2, Pencil, Plus, ChevronRight, Activity, Utensils, Calendar, Clock, Zap, UserPlus, FileText, Upload, Eye, Download, X } from 'lucide-react';

import { useClientData } from '@/context/ClientDataContext';
import { SymptomHistory } from '@/components/dietician/client/SymptomHistory';
import { PlanActionModal } from '@/components/dietician/clients/PlanActionModal';
import { calculateCycleStatus, CycleStatus } from '@/lib/cycle-utils';

export default function ClientSummaryPage() {
    const { clientInfo: client, loading, refreshClient } = useClientData();
    const router = useRouter();

    const handleReportUpload = async () => {
        if (!client || !reportFile) return;

        setReportUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', reportFile);
            // Empty data object to indicate partial update (no other fields)
            fd.append('data', JSON.stringify({}));

            await api.patch(`/api/clients/${client._id}`, fd);

            await refreshClient();
            setShowReportUpload(false);
            setReportFile(null);
            alert('Report uploaded successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to upload report');
        } finally {
            setReportUploading(false);
        }
    };

    // Existing security states
    const [showReset, setShowReset] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Symptom & Cycle state
    const [symptomLogs, setSymptomLogs] = useState<any[]>([]);
    const [periodLogs, setPeriodLogs] = useState<any[]>([]);
    const [symptomsLoading, setSymptomsLoading] = useState(true);

    // Report Upload State
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [showReportUpload, setShowReportUpload] = useState(false);
    const [reportUploading, setReportUploading] = useState(false);



    // Plan Management State
    const [showPlanModal, setShowPlanModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!client?._id) return;
            try {
                const [symptoms, periods] = await Promise.all([
                    api.get<any[]>(`/api/clients/${client._id}/symptom-logs`),
                    client.gender === 'female' ? api.get<any[]>(`/api/clients/${client._id}/period-logs`) : Promise.resolve([])
                ]);
                setSymptomLogs(symptoms);
                setPeriodLogs(periods);
            } catch (err) {
                console.error('Failed to fetch logs:', err);
            } finally {
                setSymptomsLoading(false);
            }
        };
        fetchData();
    }, [client?._id, client?.gender]);

    const latestPeriod = periodLogs.length > 0 ? periodLogs[0] : null;
    let cycleStatus: CycleStatus | null = null;

    if (client?.gender === 'female' && latestPeriod) {
        cycleStatus = calculateCycleStatus(latestPeriod.startDate, client.cycleLength || 28);
    }

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

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
    if (!client) return <div className="p-8">Client not found</div>;

    const initials = client.name.split(' ').map(n => n[0]).join('').toUpperCase();

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Basic Info & Metrics */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Basic Summary Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-2xl border-2 border-white shadow-sm ring-1 ring-emerald-200 font-serif">
                            {initials}
                        </div>
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-slate-800">{client.name}</h2>
                            <p className="text-sm text-slate-400 font-medium">{client.id}</p>
                            <div className="mt-4 flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{client.preferences || 'No Preferences Set'}</span>
                                {client.primaryGoal && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none mr-1">Goal:</span>
                                        {Array.isArray(client.primaryGoal) ? (
                                            client.primaryGoal.map((goal, idx) => (
                                                <span key={idx} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">
                                                    {goal}{idx < (client.primaryGoal?.length || 0) - 1 ? ', ' : ''}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-none">{client.primaryGoal}</span>
                                        )}
                                    </div>
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
                            {client.state && <span className="text-[10px] font-bold text-slate-300">{client.state}</span>}
                            <div className="mt-auto">
                                {client.city && <span className="text-xs font-bold text-slate-400">{client.city}</span>}
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
                                                <span key={idx} className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
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
                                <Key className="w-5 h-5 text-emerald-500" />
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Security</h3>
                            </div>
                            {!showReset ? (
                                <button onClick={() => setShowReset(true)} className="w-full py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded hover:bg-slate-50">Reset Password</button>
                            ) : (
                                <form onSubmit={handlePasswordReset} className="flex gap-2">
                                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded outline-none focus:ring-1 focus:ring-emerald-500" placeholder="New Password" />
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
                                <>
                                    {client.status === 'DELETED' ? (
                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={async () => {
                                                    const previousStatus = client.previousStatus || 'ACTIVE';
                                                    if (!confirm(`Recover as '${previousStatus}'? The client will be restored to their state before deletion.`)) return;
                                                    setDeleteLoading(true);
                                                    try {
                                                        await api.patch(`/api/clients/${client._id}`, { recoverAction: 'RESTORE_PREVIOUS' });
                                                        alert('Account recovered successfully!');
                                                        refreshClient();
                                                    } catch (err: any) {
                                                        const message = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to recover account';
                                                        alert(`Error: ${message}`);
                                                    } finally {
                                                        setDeleteLoading(false);
                                                    }
                                                }}
                                                disabled={deleteLoading}
                                                className="w-full bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold hover:bg-emerald-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                                                Recover Last State
                                                {client.previousStatus && <span className="text-xs opacity-75">({client.previousStatus})</span>}
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    if (!confirm('Recover as a NEW client? Their status will be reset to NEW.')) return;
                                                    setDeleteLoading(true);
                                                    try {
                                                        await api.patch(`/api/clients/${client._id}`, { recoverAction: 'RESTORE_NEW' });
                                                        alert('Account recovered and reset to NEW!');
                                                        refreshClient();
                                                    } catch (err: any) {
                                                        const message = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to recover account';
                                                        alert(`Error: ${message}`);
                                                    } finally {
                                                        setDeleteLoading(false);
                                                    }
                                                }}
                                                disabled={deleteLoading}
                                                className="w-full bg-sky-100 text-sky-700 py-3 rounded-xl font-bold hover:bg-sky-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                                                Recover as New Client
                                            </button>
                                        </div>
                                    ) : null}
                                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-2 border border-red-200 text-xs font-bold text-red-600 rounded hover:bg-red-50">Delete Client</button>
                                </>
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

                {/* Right Column: Persona & Cycle */}
                <div className="space-y-6">

                    {/* Subscription Plan Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} className="text-emerald-500" />
                                Current Plan
                            </h3>
                            <button
                                onClick={() => setShowPlanModal(true)}
                                className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"
                            >
                                <span className="text-lg leading-none mb-0.5">+</span> Manage
                            </button>
                        </div>

                        {client.activeSubscription ? (
                            <div className="relative z-10">
                                <div className="mb-1">
                                    <span className="text-xl font-bold text-slate-800">
                                        {typeof client.activeSubscription.planId === 'object' ? client.activeSubscription.planId.name : 'Unknown Plan'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${client.activeSubscription.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                                        client.activeSubscription.status === 'PAUSED' ? 'bg-amber-100 text-amber-700' :
                                            client.activeSubscription.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {client.activeSubscription.status}
                                    </span>
                                    <span>•</span>
                                    {(() => {
                                        const endDate = new Date(client.activeSubscription.endDate);
                                        const isPending = endDate.getFullYear() === 2099; // Placeholder date
                                        return isPending ? (
                                            <span className="text-amber-600 font-medium italic">Pending Diet Start Date</span>
                                        ) : (
                                            <span>Ends {endDate.toLocaleDateString()}</span>
                                        );
                                    })()}
                                </div>
                                {(() => {
                                    const endDate = new Date(client.activeSubscription.endDate);
                                    const isPending = endDate.getFullYear() === 2099;

                                    if (isPending) {
                                        // Show message for pending assignments
                                        return (
                                            <div className="text-xs text-slate-500 italic">
                                                Plan will activate when diet start date is set
                                            </div>
                                        );
                                    }

                                    // Show progress bar for active subscriptions
                                    return (
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            {(() => {
                                                const start = new Date(client.activeSubscription.startDate).getTime();
                                                const end = new Date(client.activeSubscription.endDate).getTime();
                                                const now = new Date().getTime();
                                                const total = end - start;
                                                const progress = total > 0 ? Math.min(100, Math.max(0, ((now - start) / total) * 100)) : 0;
                                                return <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />;
                                            })()}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50 relative z-10">
                                <p className="text-xs text-slate-400 italic mb-2">No active subscription</p>
                                <button onClick={() => setShowPlanModal(true)} className="text-xs font-bold text-emerald-600 hover:underline">
                                    Assign Plan
                                </button>
                            </div>
                        )}

                        {/* Decorative Background */}
                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-50 rounded-full blur-2xl z-0 pointer-events-none" />
                    </div>

                    {/* Medical Report Card */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-emerald-500" />
                                Medical Report
                            </h3>
                            {!showReportUpload && (
                                <button
                                    onClick={() => setShowReportUpload(true)}
                                    className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider hover:text-emerald-700 flex items-center gap-1"
                                >
                                    <Upload size={12} />
                                    {client.counsellingProfile?.medicalReport ? 'Update' : 'Upload'}
                                </button>
                            )}
                        </div>

                        {showReportUpload ? (
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => { setShowReportUpload(false); setReportFile(null); }}
                                        className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleReportUpload}
                                        disabled={!reportFile || reportUploading}
                                        className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                                    >
                                        {reportUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                {client.counsellingProfile?.medicalReport ? (
                                    (client.counsellingProfile.medicalReport.startsWith('/') || client.counsellingProfile.medicalReport.startsWith('http')) ? (
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex items-center justify-between group">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-xs font-medium text-slate-600 truncate">
                                                    {client.counsellingProfile.medicalReport.split('/').pop()}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={client.counsellingProfile.medicalReport}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors"
                                                    title="Preview"
                                                >
                                                    <Eye size={16} />
                                                </a>
                                                <a
                                                    href={client.counsellingProfile.medicalReport}
                                                    download
                                                    className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors"
                                                    title="Download"
                                                >
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 border-2 border-dashed border-red-200 rounded-lg bg-red-50/50">
                                            <p className="text-xs text-red-500 font-bold mb-1">Legacy File: {client.counsellingProfile.medicalReport}</p>
                                            <p className="text-[10px] text-slate-400">File path missing. Please upload a new report.</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
                                        <p className="text-xs text-slate-400 italic mb-2">No report available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cycle Widget (Females Only) */}
                    {client.gender === 'female' && (
                        <div className="bg-white rounded-lg border border-pink-100 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-pink-50 bg-pink-50/30 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-pink-700 uppercase tracking-widest flex items-center gap-2">
                                    <Activity size={14} />
                                    Cycle Tracker
                                </h3>
                                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest bg-white px-2 py-1 rounded-full border border-pink-100">
                                    {client.cycleLength || 28} Day Cycle
                                </span>
                            </div>

                            {cycleStatus ? (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-black text-slate-800">{cycleStatus.dayOfCycle}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Day</span>
                                            </div>
                                            <span className="text-sm font-bold text-pink-500 uppercase tracking-wider">{cycleStatus.phaseInfo.title}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-slate-400 mb-1">
                                                <Clock size={12} />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Next Period</span>
                                            </div>
                                            <span className="text-xl font-bold text-slate-700">{cycleStatus.daysUntilNextPeriod} Days</span>
                                        </div>
                                    </div>

                                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-100 mb-4">
                                        <div className="flex gap-3">
                                            <div className="mt-0.5">
                                                <Zap size={16} className="text-pink-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-bold text-pink-700 uppercase tracking-widest mb-1">Nutrition Focus</h4>
                                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                                    {cycleStatus.phaseInfo.nutritionTip}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-400 italic text-center">
                                        {cycleStatus.phaseInfo.description}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Calendar className="w-8 h-8 text-pink-200 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">No log data avaiable</p>
                                </div>
                            )}
                        </div>
                    )}

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

            {showPlanModal && client && (
                <PlanActionModal
                    client={client}
                    onClose={() => setShowPlanModal(false)}
                    onSuccess={() => { refreshClient(); setShowPlanModal(false); }}
                />
            )}
        </div>
    );
}

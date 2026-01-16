'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api-client';
import { Loader2, CreditCard, Play, Pause, Save, CheckCircle } from 'lucide-react';
import { format, differenceInDays, addMonths, addDays } from 'date-fns';

export default function ClientSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [subscription, setSubscription] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Assign Modal
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [customPrice, setCustomPrice] = useState(5000);
    const [customDuration, setCustomDuration] = useState(3);

    // Payment Modal
    const [isPaying, setIsPaying] = useState(false);
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState('CASH');

    // Pause Modal
    const [isPausing, setIsPausing] = useState(false);
    const [pauseReason, setPauseReason] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [subData, plansData] = await Promise.all([
                api.get(`/api/clients/${id}/subscription`),
                api.get('/api/plans')
            ]);
            setSubscription(subData);
            setPlans(plansData as any[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlanSelect = (planId: string) => {
        const plan = plans.find(p => p._id === planId);
        if (plan) {
            setSelectedPlanId(planId);
            setCustomPrice(plan.price);
            setCustomDuration(plan.durationMonths);
        }
    };

    const handleAssign = async () => {
        setActionLoading(true);
        try {
            // Find name if template selected, else custom
            const plan = plans.find(p => p._id === selectedPlanId);
            const planName = plan ? plan.name : 'Custom Plan';

            await api.post(`/api/clients/${id}/subscription`, {
                planId: selectedPlanId || null,
                planName,
                customPrice: Number(customPrice),
                customDurationMonths: Number(customDuration),
                startDate: new Date()
            });
            setIsAssigning(false);
            fetchData();
        } catch (error) {
            alert('Failed to assign');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!subscription) return;
        setActionLoading(true);
        try {
            await api.patch(`/api/clients/${id}/subscription`, {
                subscriptionId: subscription._id,
                amount: Number(payAmount),
                method: payMethod,
                note: 'Manual Entry'
            });
            setPayAmount('');
            setIsPaying(false);
            fetchData();
        } catch (error) {
            alert('Payment failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePauseResume = async (action: 'PAUSE' | 'RESUME') => {
        if (!subscription) return;
        setActionLoading(true);
        try {
            await api.put(`/api/clients/${id}/subscription`, {
                subscriptionId: subscription._id,
                action,
                reason: pauseReason
            });
            setPauseReason('');
            setIsPausing(false);
            fetchData();
        } catch (error) {
            alert('Status update failed');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    const daysRemaining = subscription ? differenceInDays(new Date(subscription.endDate), new Date()) : 0;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-slate-800">Subscription & Payments</h1>

            {!subscription ? (
                <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center">
                    <p className="text-slate-500 mb-4">No active subscription found for this client.</p>
                    <button
                        onClick={() => setIsAssigning(true)}
                        className="bg-[#1b4332] text-white px-6 py-2 rounded-lg hover:bg-[#143225] transition-colors"
                    >
                        Assign Plan
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Active Plan Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-[#1b4332]">{subscription.planName}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${subscription.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            subscription.status === 'PAUSED' ? 'bg-orange-100 text-orange-700' :
                                                'bg-slate-100 text-slate-600'
                                        }`}>
                                        {subscription.status}
                                    </span>
                                    <span className="text-slate-400 text-sm">•</span>
                                    <span className="text-sm text-slate-600">
                                        Ends {format(new Date(subscription.endDate), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {subscription.status === 'ACTIVE' && (
                                    <button
                                        onClick={() => setIsPausing(true)}
                                        className="text-orange-600 bg-orange-50 hover:bg-orange-100 p-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Pause size={16} /> Pause
                                    </button>
                                )}
                                {subscription.status === 'PAUSED' && (
                                    <button
                                        onClick={() => handlePauseResume('RESUME')}
                                        disabled={actionLoading}
                                        className="text-green-600 bg-green-50 hover:bg-green-100 p-2 rounded-lg flex items-center gap-2 text-sm font-medium"
                                    >
                                        <Play size={16} /> Resume
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Total Price</div>
                                <div className="text-2xl font-black text-slate-800">₹{subscription.totalAmount}</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-xl">
                                <div className="text-xs font-bold text-green-600 uppercase mb-1">Paid Amount</div>
                                <div className="text-2xl font-black text-green-800">₹{subscription.amountPaid}</div>
                            </div>
                            <div className={`p-4 rounded-xl ${subscription.totalAmount - subscription.amountPaid > 0 ? 'bg-red-50' : 'bg-slate-50'}`}>
                                <div className={`text-xs font-bold uppercase mb-1 ${subscription.totalAmount - subscription.amountPaid > 0 ? 'text-red-500' : 'text-slate-400'}`}>Pending</div>
                                <div className={`text-2xl font-black ${subscription.totalAmount - subscription.amountPaid > 0 ? 'text-red-700' : 'text-slate-800'}`}>₹{Math.max(0, subscription.totalAmount - subscription.amountPaid)}</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                            <button
                                onClick={() => setIsPaying(true)}
                                className="flex-1 bg-[#1b4332] text-white py-2.5 rounded-lg font-medium hover:bg-[#143225] transition-colors"
                            >
                                Record Payment
                            </button>
                            {/* <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50">
                                Edit Plan
                            </button> */}
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Payment History</h3>
                        </div>
                        {subscription.paymentHistory?.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">No payments recorded yet.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">Date</th>
                                        <th className="px-4 py-3 font-bold">Amount</th>
                                        <th className="px-4 py-3 font-bold">Method</th>
                                        <th className="px-4 py-3 font-bold">Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {subscription.paymentHistory.map((pay: any, i: number) => (
                                        <tr key={i} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-medium text-slate-700">{format(new Date(pay.date), 'MMM d, yyyy')}</td>
                                            <td className="px-4 py-3 font-bold text-green-600">+₹{pay.amount}</td>
                                            <td className="px-4 py-3 text-slate-500">{pay.method}</td>
                                            <td className="px-4 py-3 text-slate-400 italic">{pay.note || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}

            {/* ASSIGN MODAL */}
            {isAssigning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Assign Diet Plan</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Select Template (Optional)</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    onChange={(e) => handlePlanSelect(e.target.value)}
                                    value={selectedPlanId}
                                >
                                    <option value="">-- Custom Plan --</option>
                                    {plans.map(p => <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                                    <input
                                        type="number" className="w-full border rounded-lg p-2"
                                        value={customDuration} onChange={e => setCustomDuration(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Price (₹)</label>
                                    <input
                                        type="number" className="w-full border rounded-lg p-2"
                                        value={customPrice} onChange={e => setCustomPrice(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsAssigning(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button onClick={handleAssign} disabled={actionLoading} className="flex-1 py-2 bg-[#1b4332] text-white rounded-lg">Assign Plan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {isPaying && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4">Record Payment</h3>
                        <input
                            type="number" className="w-full border rounded-lg p-3 text-lg font-bold mb-4"
                            placeholder="Amount (₹)"
                            value={payAmount} onChange={e => setPayAmount(e.target.value)}
                            autoFocus
                        />
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {['CASH', 'UPI', 'BANK'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setPayMethod(m)}
                                    className={`py-2 text-xs font-bold rounded-lg ${payMethod === m ? 'bg-[#1b4332] text-white' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsPaying(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button onClick={handlePayment} disabled={actionLoading || !payAmount} className="flex-1 py-2 bg-[#1b4332] text-white rounded-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAUSE MODAL */}
            {isPausing && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-2">Pause Subscription</h3>
                        <p className="text-sm text-slate-500 mb-4">The plan end date will be automatically extended when you resume.</p>
                        <textarea
                            className="w-full border rounded-lg p-3 text-sm mb-6"
                            placeholder="Reason (e.g. Traveling)"
                            value={pauseReason} onChange={e => setPauseReason(e.target.value)}
                            rows={2}
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setIsPausing(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button onClick={() => handlePauseResume('PAUSE')} disabled={actionLoading} className="flex-1 py-2 bg-orange-500 text-white rounded-lg">Pause Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

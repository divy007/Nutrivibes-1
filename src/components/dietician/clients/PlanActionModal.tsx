import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Loader2, X, Check, AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { ClientInfo } from '@/types';

interface Plan {
    _id: string;
    name: string;
    durationMonths: number;
    price: number;
    features: string[];
}

interface PlanActionModalProps {
    client: ClientInfo;
    onClose: () => void;
    onSuccess: () => void;
}

export const PlanActionModal = ({ client, onClose, onSuccess }: PlanActionModalProps) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [action, setAction] = useState<'ASSIGN' | 'RENEW' | 'UPGRADE'>('ASSIGN');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeSub = client.activeSubscription;
    const currentPlan = typeof activeSub?.planId === 'object' ? activeSub.planId : null;

    // Determine if diet has started
    const dietStarted = client.dietStartDate && new Date(client.dietStartDate) <= new Date();
    const hasAssignedPlan = activeSub && activeSub.status === 'ASSIGNED';
    const hasActivePlan = activeSub && activeSub.status === 'ACTIVE';

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await api.get<Plan[]>('/api/plans?active=true');
                setPlans(data);
            } catch (err) {
                console.error('Failed to fetch plans', err);
                setError('Failed to load plans');
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    // Set default action based on context
    useEffect(() => {
        if (!dietStarted) {
            setAction('ASSIGN');
        } else if (hasActivePlan) {
            setAction('UPGRADE'); // Default to upgrade if diet started
        } else {
            setAction('RENEW');
        }
    }, [dietStarted, hasActivePlan]);

    const selectedPlan = plans.find(p => p._id === selectedPlanId);

    // Validation Logic
    const isUpgradeAllowed = () => {
        if (!activeSub || !currentPlan || !dietStarted) return false;

        // Check 30 days window
        const startDate = new Date(activeSub.startDate);
        const today = new Date();
        const diffDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        return diffDays <= 30;
    };

    const isRenewAllowed = () => {
        if (!dietStarted) return false;
        if (!activeSub) return true; // Can renew if no subscription

        // Check if near expiry (within 7 days)
        const endDate = new Date(activeSub.endDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        return daysUntilExpiry <= 7;
    };

    const getPrice = () => {
        if (!selectedPlan) return 0;
        if (action === 'ASSIGN' || action === 'RENEW') return selectedPlan.price;
        if (action === 'UPGRADE') {
            const currentPrice = currentPlan?.price || 0;
            return Math.max(0, selectedPlan.price - currentPrice);
        }
        return 0;
    };

    const handleSubmit = async () => {
        if (!selectedPlanId) return;
        setSubmitting(true);
        setError(null);
        try {
            await api.post(`/api/clients/${client._id}/subscription`, {
                action,
                planId: selectedPlanId
            });
            alert(`Plan ${action.toLowerCase()}ed successfully!`);
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to process request');
        } finally {
            setSubmitting(false);
        }
    };

    // Init selected plan logic
    useEffect(() => {
        if (plans.length > 0 && !selectedPlanId && currentPlan && action !== 'ASSIGN') {
            const exists = plans.find(p => p._id === currentPlan._id);
            if (exists) setSelectedPlanId(exists._id);
        }
    }, [plans, currentPlan, action, selectedPlanId]);

    // Filter plans for upgrade
    const availablePlans = action === 'UPGRADE' && currentPlan
        ? plans.filter(p => p.durationMonths > currentPlan.durationMonths)
        : plans;

    // Available actions based on context
    const availableActions: Array<'ASSIGN' | 'RENEW' | 'UPGRADE'> = [];
    if (!dietStarted) {
        availableActions.push('ASSIGN');
    } else {
        if (isUpgradeAllowed()) availableActions.push('UPGRADE');
        if (isRenewAllowed()) availableActions.push('RENEW');
    }

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 uppercase tracking-tight">Manage Subscription</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {/* Diet Start Date Info */}
                    {!client.dietStartDate && action === 'ASSIGN' && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <div className="flex gap-2">
                                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-blue-800 text-sm">No Diet Start Date Set</h4>
                                    <p className="text-xs text-blue-700 mt-1">
                                        Plan will start from <strong>today</strong>. You can set a diet start date in the client profile to schedule it for a future date.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Current Plan Info */}
                    {activeSub && currentPlan && (
                        <div className={`mb-6 p-4 rounded-xl border ${activeSub.status === 'ASSIGNED'
                                ? (client.dietStartDate ? 'bg-blue-50 border-blue-100' : 'bg-amber-50 border-amber-100')
                                : 'bg-emerald-50 border-emerald-100'
                            }`}>
                            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${activeSub.status === 'ASSIGNED'
                                    ? (client.dietStartDate ? 'text-blue-600' : 'text-amber-600')
                                    : 'text-emerald-600'
                                }`}>
                                {activeSub.status === 'ASSIGNED'
                                    ? (client.dietStartDate ? 'Assigned Plan' : 'Pending Assignment')
                                    : 'Current Plan'}
                            </h4>
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-slate-800">{currentPlan.name}</span>
                                <span className={`text-sm font-medium ${activeSub.status === 'ASSIGNED'
                                        ? (client.dietStartDate ? 'text-blue-700' : 'text-amber-700')
                                        : 'text-emerald-700'
                                    }`}>₹{currentPlan.price}</span>
                            </div>
                            {client.dietStartDate ? (
                                <div className={`text-xs mt-1 ${activeSub.status === 'ASSIGNED' ? 'text-blue-600/80' : 'text-emerald-600/80'
                                    }`}>
                                    {activeSub.status === 'ASSIGNED' ? 'Starts' : 'Ends'} on {new Date(activeSub.status === 'ASSIGNED' ? activeSub.startDate : activeSub.endDate).toLocaleDateString()}
                                </div>
                            ) : (
                                <div className="text-xs mt-1 text-amber-600/80 italic">
                                    Waiting for diet start date to be set
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Tabs */}
                    {availableActions.length > 1 && (
                        <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                            {availableActions.map(act => (
                                <button
                                    key={act}
                                    onClick={() => setAction(act)}
                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${action === act
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {act}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Validation Messages */}
                    {action === 'UPGRADE' && !isUpgradeAllowed() && dietStarted ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <h4 className="font-bold text-slate-700">Upgrade Unavailable</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Upgrades are only allowed within the first 30 days of a subscription.
                            </p>
                        </div>
                    ) : action === 'RENEW' && !isRenewAllowed() ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <h4 className="font-bold text-slate-700">Renew Unavailable</h4>
                            <p className="text-xs text-slate-500 mt-1">
                                Renewals are only allowed within 7 days of subscription expiry.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loading ? (
                                <div className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></div>
                            ) : availablePlans.length === 0 ? (
                                <div className="text-center p-6 text-slate-400 text-sm italic">No valid plans available for {action.toLowerCase()}.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {availablePlans.map(plan => (
                                        <button
                                            key={plan._id}
                                            onClick={() => setSelectedPlanId(plan._id)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all relative group ${selectedPlanId === plan._id
                                                ? 'border-emerald-500 bg-emerald-50'
                                                : 'border-slate-100 hover:border-emerald-300'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-slate-800">{plan.name}</div>
                                                    <div className="text-[10px] uppercase font-bold text-slate-400">{plan.durationMonths} Months</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-emerald-600">
                                                        {action === 'UPGRADE'
                                                            ? `+₹${Math.max(0, plan.price - (currentPlan?.price || 0))}`
                                                            : `₹${plan.price}`}
                                                    </div>
                                                    {action === 'UPGRADE' && <div className="text-[10px] line-through text-slate-300">₹{plan.price}</div>}
                                                </div>
                                            </div>
                                            {selectedPlanId === plan._id && (
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                                                    <Check size={14} strokeWidth={3} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedPlan && (
                                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-medium">Plan Duration</span>
                                        <span className="font-bold text-slate-700">{selectedPlan.durationMonths} Months</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500 font-medium">
                                            {action === 'UPGRADE' ? 'Payable Difference' : action === 'ASSIGN' ? 'Plan Price' : 'Total Payable'}
                                        </span>
                                        <span className="font-bold text-emerald-600 text-lg">₹{getPrice()}</span>
                                    </div>
                                    {action === 'ASSIGN' && (
                                        <div className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-200 pt-2">
                                            * Plan will start on {client.dietStartDate ? new Date(client.dietStartDate).toLocaleDateString() : new Date().toLocaleDateString() + ' (today)'}
                                        </div>
                                    )}
                                    {action === 'UPGRADE' && (
                                        <div className="text-[10px] text-slate-400 italic mt-2 border-t border-slate-200 pt-2">
                                            * Upgrade backdated to original start date. End date extends to match new duration.
                                        </div>
                                    )}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || !selectedPlanId}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>
                                        Confirm {action === 'ASSIGN' ? 'Assignment' : action === 'RENEW' ? 'Renewal' : 'Upgrade'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

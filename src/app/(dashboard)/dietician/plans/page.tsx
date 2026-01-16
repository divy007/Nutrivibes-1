'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Loader2, Plus, Check, Edit2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [durationMonths, setDurationMonths] = useState(1);
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');

    const router = useRouter();

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await api.get('/api/plans');
            setPlans(data as any[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setDurationMonths(1);
        setPrice('');
        setDescription('');
        setIsCreating(false);
        setEditingPlanId(null);
    };

    const handleEditClick = (plan: any) => {
        setEditingPlanId(plan._id);
        setName(plan.name);
        setDurationMonths(plan.durationMonths);
        setPrice(plan.price);
        setDescription(plan.description || '');
        setIsCreating(true); // Re-use the form UI
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlanId) {
                // Update existing
                await api.put('/api/plans', {
                    _id: editingPlanId,
                    name,
                    durationMonths: Number(durationMonths),
                    price: Number(price),
                    description
                });
            } else {
                // Create new
                await api.post('/api/plans', {
                    name,
                    durationMonths: Number(durationMonths),
                    price: Number(price),
                    description
                });
            }

            resetForm();
            fetchPlans();
        } catch (error) {
            alert('Failed to save plan');
        }
    };

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 bg-slate-50 min-h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-[#1b4332]">Subscription Plans</h1>
                    <p className="text-slate-500">Manage your diet plan templates here.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsCreating(true); }}
                    className="bg-[#1b4332] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#143225] transition-colors"
                >
                    <Plus size={18} /> Add New Plan
                </button>
            </div>

            {/* Creation/Edit Modal / Form Area */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{editingPlanId ? 'Edit Plan' : 'Create New Plan Template'}</h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name</label>
                            <input
                                type="text"
                                value={name} onChange={e => setName(e.target.value)} required
                                className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Wedding Transformation"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Duration (Months)</label>
                            <input
                                type="number" min="1"
                                value={durationMonths} onChange={e => setDurationMonths(Number(e.target.value))} required
                                className="w-full border rounded-lg px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                            <input
                                type="number"
                                value={price} onChange={e => setPrice(e.target.value)} required
                                className="w-full border rounded-lg px-3 py-2" placeholder="5000"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <textarea
                                value={description} onChange={e => setDescription(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2" rows={2}
                            />
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 mt-2">
                            <button type="button" onClick={resetForm} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg">Cancel</button>
                            <button type="submit" className="px-4 py-2 bg-[#1b4332] text-white rounded-lg">
                                {editingPlanId ? 'Update Plan' : 'Save Plan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan: any) => (
                    <div key={plan._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">

                        {/* Edit Button */}
                        <button
                            onClick={() => handleEditClick(plan)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-[#1b4332] hover:text-white transition-colors z-10"
                            title="Edit Plan"
                        >
                            <Edit2 size={16} />
                        </button>

                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Check size={64} color="#1b4332" />
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 mb-1 pr-8">{plan.name}</h3>
                        <div className="text-3xl font-black text-[#1b4332] mb-4">₹{plan.price}</div>

                        <div className="space-y-2 text-sm text-slate-600 mb-6">
                            <div className="flex justify-between border-b pb-2">
                                <span>Duration</span>
                                <span className="font-bold">{plan.durationMonths} Months</span>
                            </div>
                            {plan.description && <p className="italic text-slate-500 text-xs">{plan.description}</p>}
                        </div>
                    </div>
                ))}
                {plans.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12 text-slate-400">
                        No plans created yet. Click "Add New Plan" to start.
                    </div>
                )}
            </div>
        </div>
    );
}

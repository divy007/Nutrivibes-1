'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
    Search,
    Filter,
    ChevronDown,
    Play,
    Clock,
    Check
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { CounsellingFlow } from '@/components/dietician/clients/CounsellingFlow';
import { useClientData } from '@/context/ClientDataContext';

export default function CounsellingPage() {
    const { clientInfo: client, loading, refreshClient } = useClientData();
    const [showFlow, setShowFlow] = useState(false);

    const handleStartCounselling = () => {
        setShowFlow(true);
    };

    const handleFinishFlow = async (formData: any) => {
        console.log('Starting handleFinishFlow', formData);
        try {
            if (!client) {
                console.error('No client data found!');
                return;
            }
            console.log('Sending PATCH request to', `/api/clients/${client._id}`);
            const payload = {
                status: 'ACTIVE',
                // Basic info updates
                age: formData.age,
                height: formData.height,
                weight: formData.weight,
                gender: formData.gender.toLowerCase(),
                dietStartDate: formData.dietStartDate,

                // Detailed Counselling Profile
                counsellingProfile: {
                    // Demographics
                    country: formData.country,
                    heightUnit: formData.heightUnit,
                    weightUnit: formData.weightUnit,
                    maritalStatus: formData.maritalStatus,
                    workType: formData.workType,
                    shiftType: formData.shiftType,
                    staying: formData.staying,
                    placeOfWork: formData.placeOfWork,

                    // Medical
                    medicalConditions: formData.medicalConditions,
                    otherMedicalCondition: formData.otherMedicalCondition,
                    deficiencies: formData.deficiencies,
                    otherDeficiency: formData.otherDeficiency,
                    surgeries: formData.surgeries,
                    otherSurgery: formData.otherSurgery,
                    medications: formData.medications,
                    medicalReport: formData.medicalReport ? formData.medicalReport.name : null, // Handle file properly if needed

                    // Lifestyle
                    smoking: formData.smoking,
                    cigarettesPerDay: formData.cigarettesPerDay,
                    alcohol: formData.alcohol,
                    alcoholTypes: formData.alcoholTypes,
                    alcoholFrequency: formData.alcoholFrequency,
                    stressLevel: formData.stressLevel,
                    emotionalEating: formData.emotionalEating,

                    // Dietary
                    previousDiets: formData.previousDiets,
                    noMeatDays: formData.noMeatDays,
                    fastDays: formData.fastDays,
                    cheatMeals: formData.cheatMeals,

                    // Goals
                    medicalGoal: formData.medicalGoal,
                    loseWeightReasons: formData.loseWeightReasons
                }
            };

            const response = await api.patch(`/api/clients/${client._id}`, payload);
            console.log('PATCH response:', response);

            setShowFlow(false);
            // Refresh global client data to update header and other views
            await refreshClient();
        } catch (error) {
            console.error('Failed to save counselling data:', error);
            alert(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (showFlow) {
        return (
            <div className="p-6 bg-slate-50 min-h-full">
                <CounsellingFlow
                    onClose={() => setShowFlow(false)}
                    onFinish={handleFinishFlow}
                    initialData={{
                        ...client?.counsellingProfile,
                        age: client?.age,
                        height: client?.height,
                        weight: client?.weight,
                        gender: client?.gender
                    }}
                />
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-full">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold text-slate-800">Counselling</h1>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleStartCounselling}
                            className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition-all shadow-md active:scale-95"
                        >
                            <Play size={16} fill="currentColor" />
                            Start New Session
                        </button>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search date"
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                            <Filter size={16} />
                            Advanced Filters
                        </button>
                    </div>
                </div>

                {/* Counselling Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-16">S.No</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Coach</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* If client has a counselling profile, show it as completed */}
                            {client?.counsellingProfile ? (
                                <tr className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">1</td>
                                    <td className="px-4 py-4 text-sm text-slate-600 font-bold">{format(new Date(client.updatedAt || Date.now()), 'dd MMM yyyy')}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600 font-bold">{format(new Date(client.updatedAt || Date.now()), 'hh:mm a')}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">Diet</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">Assigned Coach</td>
                                    <td className="px-4 py-4">
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Completed</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase bg-emerald-50 px-2 py-1 rounded w-fit">
                                            <Check className="w-3 h-3" />
                                            Active
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={handleStartCounselling}
                                            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 mx-auto"
                                        >
                                            <Play size={12} fill="currentColor" />
                                            Restart
                                        </button>
                                    </td>
                                </tr>
                            ) : client?.status === 'NEW' ? (
                                <tr className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-4 py-4 text-sm text-slate-600 text-center font-medium">1</td>
                                    <td className="px-4 py-4 text-sm text-slate-600 font-bold">{format(new Date(), 'dd MMM yyyy')}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600 font-bold">{format(new Date(), 'hh:mm a')}</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">Diet</td>
                                    <td className="px-4 py-4 text-sm text-slate-600">Assigned Coach</td>
                                    <td className="px-4 py-4">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">New</span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1.5 text-orange-600 font-bold text-xs uppercase bg-orange-50 px-2 py-1 rounded w-fit">
                                            <Clock size={12} strokeWidth={3} />
                                            Pending
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                        <button
                                            onClick={handleStartCounselling}
                                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2 mx-auto"
                                        >
                                            <Play size={12} fill="currentColor" />
                                            Start
                                        </button>
                                    </td>
                                </tr>
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                                        No historical counselling sessions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Placeholder */}
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400 uppercase font-bold tracking-tight">Items per page: 10</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-400 font-medium mr-4">1 - 1 of 1</span>
                            <button className="p-1 text-slate-300 hover:text-slate-500" disabled><ChevronDown className="rotate-90" size={18} /></button>
                            <button className="p-1 text-slate-300 hover:text-slate-500" disabled><ChevronDown className="-rotate-90" size={18} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

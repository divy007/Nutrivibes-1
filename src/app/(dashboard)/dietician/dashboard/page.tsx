'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  PauseCircle,
  Clock,
  ChevronRight,
  MessageCircle,
  Zap,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

interface Stats {
  activeClients: number;
  newClients: number;
  pausedClients: number;
  expiredClients: number;
}

export default function DieticianDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<Stats>('/api/dietician/stats');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-slate-50 min-h-full">
      {/* Top Banner */}
      <div className="bg-[#6d59a3] text-white px-6 py-2 flex items-center justify-center gap-4 text-sm font-medium">
        <span>Check out the new Home Page to manage your Today's tasks.</span>
        <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">View My Tasks</button>
      </div>

      <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto">

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <h1 className="text-xl font-bold text-slate-800">Homepage</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard title="Active Clients" count={stats?.activeClients ?? 0} icon={<Users className="text-emerald-500" />} color="border-emerald-500" loading={loading} />
            <SummaryCard title="New Clients (Last 15 days)" count={stats?.newClients ?? 0} icon={<UserPlus className="text-blue-500" />} color="border-blue-500" loading={loading} />
            <SummaryCard title="Paused Clients" count={stats?.pausedClients ?? 0} icon={<PauseCircle className="text-rose-400" />} color="border-rose-400" loading={loading} />
            <SummaryCard title="Expired Clients (Last 15 days)" count={stats?.expiredClients ?? 0} icon={<Clock className="text-indigo-400" />} color="border-indigo-400" loading={loading} />
          </div>

          {/* Today's Task Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-700">Today's Task</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Counselling Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6 flex flex-col">
                <h3 className="text-sm font-bold text-rose-500 mb-4">Today's Counselling</h3>
                <div className="space-y-1 mb-6">
                  <div className="text-xs font-bold text-slate-600">Total Counselling: <span className="text-slate-900">0</span></div>
                  <div className="text-xs font-bold text-slate-600">Total Counselling Left: <span className="text-slate-900">0</span></div>
                </div>
                <button className="mt-auto text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 hover:text-orange-600">
                  View Details <ChevronRight size={12} className="rotate-90 translate-y-0.5" />
                </button>
              </div>

              {/* Follow Ups Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-bold text-[#6d59a3]">Today's Follow Up</h3>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">Total Followups: 17</div>
                    <div className="text-[10px] font-bold text-slate-400">Total Followups Left: 17</div>
                  </div>
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Plan</th>
                      <th className="py-2 text-center">Diet Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { name: 'Alisha Pradeep (#503392)', plan: 'DM Core - 6 Months', color: 'bg-amber-400' },
                      { name: 'Abhishek (#503392)', plan: 'Cure & Reverse - 9 Months', color: 'bg-amber-400' },
                      { name: 'Kayser Bhat (#503392)', plan: 'Cure & Reverse - 3 Months', color: 'bg-amber-400' },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 font-bold text-slate-700">{row.name}</td>
                        <td className="py-2 text-slate-500">{row.plan}</td>
                        <td className="py-2"><div className={`w-3 h-3 rounded-full mx-auto ${row.color}`}></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="mt-4 text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 hover:text-orange-600">
                  View Details <ChevronRight size={12} className="rotate-90 translate-y-0.5" />
                </button>
              </div>

              {/* Diet's Pending Card */}
              <div className="bg-white rounded-lg border border-slate-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-bold text-emerald-600">Diet's Pending</h3>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">Total Diets Pending: 26</div>
                    <div className="text-[10px] font-bold text-emerald-600">Yellow: 17 <span className="text-rose-500">Red: 8</span> <span className="text-slate-900">Black: 1</span></div>
                  </div>
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-left">Plan</th>
                      <th className="py-2 text-center">Diet Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { name: 'Sarita (#490446524)', plan: 'WM Core - 6 Months', color: 'bg-slate-900' },
                      { name: 'Kritika (#492591292)', plan: 'WM Core - 9 Months', color: 'bg-rose-500' },
                      { name: 'Niki (#492662285)', plan: 'Cure & Reverse - 6 Months', color: 'bg-rose-500' },
                    ].map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 font-bold text-slate-700">{row.name}</td>
                        <td className="py-2 text-slate-500">{row.plan}</td>
                        <td className="py-2"><div className={`w-3 h-3 rounded-full mx-auto ${row.color}`}></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="mt-4 text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 hover:text-orange-600">
                  View Details <ChevronRight size={12} className="rotate-90 translate-y-0.5" />
                </button>
              </div>

            </div>
          </div>

          {/* Opportunities Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-700">Opportunities</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <OpportunityCard title="Renewal" label="Top users for renewals: 0" color="text-rose-500" />
              <OpportunityCard title="Reactivation Opportunities" label="Top Reactivation Opportunities: 0" color="text-blue-500" />
              <OpportunityCard title="Ask for Referral Opportunities" label="Top users for referrals: 27" color="text-emerald-600" isReferral />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function SummaryCard({ title, count, icon, color, loading }: { title: string, count: number, icon: any, color: string, loading?: boolean }) {
  return (
    <div className={`bg-white rounded-lg p-5 border-l-4 ${color} shadow-sm flex items-center justify-between min-h-[100px]`}>
      <div className="bg-slate-50 p-3 rounded-full">
        {icon}
      </div>
      <div className="text-right">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</div>
        {loading ? (
          <div className="flex justify-end pt-1">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="text-3xl font-bold text-slate-700">{count}</div>
        )}
      </div>
    </div>
  );
}

function OpportunityCard({ title, label, color, isReferral = false }: { title: string, label: string, color: string, isReferral?: boolean }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
      <div className="space-y-1">
        <h3 className={`text-xs font-bold uppercase tracking-widest ${color}`}>{title}</h3>
        <div className="text-[10px] font-bold text-slate-400">{label}</div>
      </div>

      {isReferral && (
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100">
              <th className="py-2 text-left">Name</th>
              <th className="py-2 text-left">Plan</th>
              <th className="py-2 text-center">Avg CSAT</th>
              <th className="py-2 text-center">DP</th>
              <th className="py-2 text-center">RSP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium">
            {[
              { name: 'Udita (#492539871)', plan: 'WM Core - 6 Months', csat: '5.00', dp: 182, rsp: 1 },
              { name: 'Jaykumar (#492337735)', plan: 'WM Core - 9 Months', csat: '4.67', dp: 175, rsp: 0 },
              { name: 'Chaitali (#492529503)', plan: 'Live Classes - 3 Months', csat: '4.71', dp: 275, rsp: 1 },
            ].map((row, i) => (
              <tr key={i}>
                <td className="py-2 text-slate-700">{row.name}</td>
                <td className="py-2 text-slate-500">{row.plan}</td>
                <td className="py-2 text-center text-slate-500">{row.csat}</td>
                <td className="py-2 text-center text-slate-500">{row.dp}</td>
                <td className="py-2 text-center text-slate-500">{row.rsp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button className="text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 hover:text-orange-600">
        View Details <ChevronRight size={12} className="rotate-90 translate-y-0.5" />
      </button>
    </div>
  );
}

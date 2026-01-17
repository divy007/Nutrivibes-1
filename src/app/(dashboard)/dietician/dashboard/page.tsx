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
  leadsCount: number;
  todayFollowUps: { name: string; color: string }[];
  analysis?: {
    todayCounsellingCount: number;
    dietPendingCount: number;
    dietPendingCounts: {
      red: number;
      yellow: number;
      black: number;
    };
    dietPendingList: { name: string; color: string }[];
  };
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
    <div className="bg-[#FAF9F6] min-h-full">
      {/* Top Banner */}
      <div className="bg-brand-sage text-white px-6 py-2 flex items-center justify-center gap-4 text-sm font-medium">
        <span>Check out the new Home Page to manage your Today's tasks.</span>
        <Link href="/dietician/clients?status=FOLLOWUP_TODAY" className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors cursor-pointer">
          View My Tasks
        </Link>
      </div>

      <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-[1800px] mx-auto">

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          <h1 className="text-xl font-bold text-slate-800">Homepage</h1>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <Link href="/dietician/clients?status=ACTIVE">
              <SummaryCard title="Active Clients" count={stats?.activeClients ?? 0} icon={<Users className="text-emerald-500" />} color="border-emerald-500" loading={loading} />
            </Link>
            <Link href="/dietician/clients?status=NEW">
              <SummaryCard title="New Clients (Last 7 days)" count={stats?.newClients ?? 0} icon={<UserPlus className="text-brand-sage" />} color="border-brand-sage" loading={loading} />
            </Link>
            <Link href="/dietician/clients?status=PAUSED">
              <SummaryCard title="Paused Clients" count={stats?.pausedClients ?? 0} icon={<PauseCircle className="text-rose-400" />} color="border-rose-400" loading={loading} />
            </Link>
            <Link href="/dietician/clients?status=DELETED">
              <SummaryCard title="Expired Clients (Deleted)" count={stats?.expiredClients ?? 0} icon={<Clock className="text-brand-earth" />} color="border-brand-earth" loading={loading} />
            </Link>
            <Link href="/dietician/clients?status=LEADS">
              <SummaryCard title="Leads (Incomplete)" count={stats?.leadsCount ?? 0} icon={<Zap className="text-orange-500" />} color="border-orange-500" loading={loading} />
            </Link>
          </div>

          {/* Today's Task Section */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-700">Today's Task</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Follow Ups Card */}
              <div className="bg-white rounded-[24px] border border-slate-100 p-6 soft-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-black text-brand-sage">Today's Follow Up</h3>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">Total Followups: {stats?.todayFollowUps?.length ?? 0}</div>
                    <div className="text-[10px] font-bold text-slate-400">Total Followups Left: {stats?.todayFollowUps?.length ?? 0}</div>
                  </div>
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-center">Diet Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(stats?.todayFollowUps || []).map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 font-bold text-slate-700">{row.name}</td>
                        <td className="py-2"><div className={`w-3 h-3 rounded-full mx-auto ${row.color}`}></div></td>
                      </tr>
                    ))}
                    {/* Empty State */}
                    {(!stats?.todayFollowUps || stats.todayFollowUps.length === 0) && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400 italic">
                          No follow ups scheduled for today
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Link href="/dietician/clients?status=FOLLOWUP_TODAY" className="mt-4 text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 hover:text-orange-600">
                  View Details <ChevronRight size={12} className="rotate-90 translate-y-0.5" />
                </Link>
              </div>

              {/* Diet's Pending Card */}
              <div className="bg-white rounded-[24px] border border-slate-100 p-6 soft-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-black text-brand-sage">Diet's Pending</h3>
                  <div className="text-right">
                    <div className="text-[10px] font-bold text-slate-400">Total Diets Pending: {stats?.analysis?.dietPendingCount ?? 0}</div>
                    <div className="text-[10px] font-bold text-emerald-600">
                      <span className="text-amber-500">Yellow: {stats?.analysis?.dietPendingCounts.yellow ?? 0}</span>{' '}
                      <span className="text-rose-500">Red: {stats?.analysis?.dietPendingCounts.red ?? 0}</span>{' '}
                      <span className="text-slate-900">Black: {stats?.analysis?.dietPendingCounts.black ?? 0}</span>
                    </div>
                  </div>
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="py-2 text-left">Name</th>
                      <th className="py-2 text-center">Diet Color</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(stats?.analysis?.dietPendingList || []).map((row: any, i: number) => (
                      <tr key={i}>
                        <td className="py-2 font-bold text-slate-700">{row.name}</td>
                        <td className="py-2"><div className={`w-3 h-3 rounded-full mx-auto ${row.color}`}></div></td>
                      </tr>
                    ))}
                    {/* Empty State */}
                    {(!stats?.analysis?.dietPendingList || stats.analysis.dietPendingList.length === 0) && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-slate-400 italic">
                          No pending diets
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <Link href="/dietician/clients?status=ACTIVE" className="mt-4 text-[10px] font-bold text-orange-500 uppercase flex items-center gap-1 hover:text-orange-600">
                  View Details <ChevronRight size={12} className="rotate-90 translate-y-0.5" />
                </Link>
              </div>

            </div>
          </div>


        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, count, icon, color, loading }: { title: string, count: number, icon: any, color: string, loading?: boolean }) {
  return (
    <div className={`bg-white rounded-[24px] p-6 border border-slate-100 soft-shadow flex items-center justify-between min-h-[110px] relative overflow-hidden group hover:scale-[1.02] transition-all`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.replace('border-', 'bg-')}`}></div>
      <div className="bg-brand-cream/50 p-4 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
        {loading ? (
          <div className="flex justify-end pt-1">
            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
          </div>
        ) : (
          <div className="text-3xl font-black text-brand-forest">{count}</div>
        )}
      </div>
    </div>
  );
}



'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  PauseCircle,
  Clock,
  ChevronRight,
  Zap,
  Loader2,
  Calendar,
  ClipboardList,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { RegionChart } from '@/components/dietician/analytics/RegionChart';
import PendingPauseRequests from '@/components/dietician/dashboard/PendingPauseRequests';
import { format } from 'date-fns';

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
  const [activeTab, setActiveTab] = useState<'followup' | 'pending'>('followup');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="bg-[#FAF9F6] min-h-full pb-10">
      {/* Top Interactive Banner */}
      <div className="bg-brand-sage text-white px-6 py-2.5 flex items-center justify-center gap-4 text-sm font-medium shadow-sm transition-all duration-300">
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          Manage today's tasks directly from the client planner views.
        </span>
        <Link href="/dietician/clients?status=FOLLOWUP_TODAY" className="bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer uppercase tracking-wider">
          View Tasks
        </Link>
      </div>

      <div className="p-6 max-w-[1800px] mx-auto space-y-6">
        
        {/* Pending Requests Section (Collapses if empty) */}
        <PendingPauseRequests />

        {/* Unified Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Bento Block 1: Welcome & Quick Actions (Spans 3 cols on desktop) */}
          <div className="col-span-1 md:col-span-2 xl:col-span-3 bg-gradient-to-br from-brand-forest to-brand-sage text-white rounded-[32px] p-8 relative overflow-hidden soft-shadow flex flex-col justify-between min-h-[220px]">
            {/* Visual background details */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="z-10">
              <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
                Good morning, Mansi! <span className="animate-bounce inline-block">👋</span>
              </h1>
              <p className="text-brand-cream/80 text-sm max-w-2xl font-medium leading-relaxed">
                Ready to guide your clients on their wellness journey today? You have{' '}
                <span className="text-white font-black underline decoration-brand-clay decoration-2">
                  {stats?.analysis?.dietPendingCount ?? 0} diet plans
                </span>{' '}
                pending review and{' '}
                <span className="text-white font-black underline decoration-brand-clay decoration-2">
                  {stats?.todayFollowUps?.length ?? 0} scheduled follow-ups
                </span>.
              </p>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-3 z-10">
              <Link href="/dietician/clients/new" className="bg-white hover:bg-brand-cream text-brand-forest px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer">
                + Register Client
              </Link>
              <Link href="/dietician/recipes" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
                View Recipes
              </Link>
              <Link href="/dietician/plans" className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer">
                Subscription Plans
              </Link>
            </div>
          </div>

          {/* Bento Block 2: Date Display widget (Spans 1 col) */}
          <div className="col-span-1 bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col justify-between soft-shadow relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-brand-cream/50 rounded-2xl text-brand-earth">
                <Calendar size={20} />
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider">Online</span>
              </div>
            </div>
            
            <div className="my-auto text-center py-2">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Today's Date</div>
              <div className="text-3.5xl font-black text-brand-forest tracking-tight">
                {mounted ? format(new Date(), 'dd MMM') : '--'}
              </div>
              <div className="text-xs font-bold text-brand-sage mt-1">
                {mounted ? format(new Date(), 'EEEE') : '--'}
              </div>
            </div>
            
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center border-t border-slate-50 pt-3">
              NutriVibes Console v1.0
            </div>
          </div>

          {/* Bento Block 3-6: Key Metrics Cards (Grid layout) */}
          <Link href="/dietician/clients?status=ACTIVE" className="block">
            <SummaryCard
              title="Active Clients"
              count={stats?.activeClients ?? 0}
              icon={<Users className="w-5 h-5 text-emerald-600" />}
              color="bg-emerald-50 text-emerald-600"
              glow="bg-emerald-400"
              loading={loading}
            />
          </Link>
          <Link href="/dietician/clients?status=NEW" className="block">
            <SummaryCard
              title="New Clients (7 Days)"
              count={stats?.newClients ?? 0}
              icon={<UserPlus className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50 text-blue-600"
              glow="bg-blue-400"
              loading={loading}
            />
          </Link>
          <Link href="/dietician/clients?status=PAUSED" className="block">
            <SummaryCard
              title="Paused Clients"
              count={stats?.pausedClients ?? 0}
              icon={<PauseCircle className="w-5 h-5 text-amber-600" />}
              color="bg-amber-50 text-amber-600"
              glow="bg-amber-400"
              loading={loading}
            />
          </Link>
          <Link href="/dietician/clients?status=EXPIRED" className="block">
            <SummaryCard
              title="Expired Plans"
              count={stats?.expiredClients ?? 0}
              icon={<Clock className="w-5 h-5 text-rose-600" />}
              color="bg-rose-50 text-rose-600"
              glow="bg-rose-400"
              loading={loading}
            />
          </Link>

          {/* Bento Block 7: Tabbed Daily Tasks Card (Spans 2 cols) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-[32px] border border-slate-100 p-6 soft-shadow flex flex-col min-h-[450px] relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-sage/10 rounded-2xl text-brand-sage">
                  <ClipboardList size={20} />
                </div>
                <div>
                  <h3 className="font-black text-brand-forest text-lg">Daily Dashboard</h3>
                  <p className="text-slate-400 text-xs font-medium">Coordinate user follow-ups and diets</p>
                </div>
              </div>
              
              {/* Modern Segmented Tab Picker */}
              <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
                <button
                  onClick={() => setActiveTab('followup')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'followup' ? 'bg-brand-sage text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Followups ({stats?.todayFollowUps?.length ?? 0})
                </button>
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'pending' ? 'bg-brand-sage text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Diets ({stats?.analysis?.dietPendingCount ?? 0})
                </button>
              </div>
            </div>

            {/* List Table container */}
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {activeTab === 'followup' ? (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px] tracking-wider">
                        <th className="py-3 text-left">Name</th>
                        <th className="py-3 text-center">Diet Alert Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {(stats?.todayFollowUps || []).map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-700">{row.name}</td>
                          <td className="py-3">
                            <div className={`w-3 h-3 rounded-full mx-auto shadow-inner ${row.color}`}></div>
                          </td>
                        </tr>
                      ))}
                      {(!stats?.todayFollowUps || stats.todayFollowUps.length === 0) && (
                        <tr>
                          <td colSpan={2} className="py-16 text-center text-slate-400 italic font-medium">
                            No follow ups scheduled for today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {stats?.todayFollowUps && stats.todayFollowUps.length > 0 && (
                    <div className="pt-4 border-t border-slate-50 mt-auto">
                      <Link href="/dietician/clients?status=FOLLOWUP_TODAY" className="inline-flex items-center gap-1.5 text-xs font-black text-brand-sage hover:text-brand-forest uppercase tracking-widest cursor-pointer">
                        Manage Followups <ChevronRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase border-b border-slate-100 text-[10px] tracking-wider">
                        <th className="py-3 text-left">Name</th>
                        <th className="py-3 text-center">Diet Alert Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs">
                      {(stats?.analysis?.dietPendingList || []).map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-700">{row.name}</td>
                          <td className="py-3">
                            <div className={`w-3 h-3 rounded-full mx-auto shadow-inner ${row.color}`}></div>
                          </td>
                        </tr>
                      ))}
                      {(!stats?.analysis?.dietPendingList || stats.analysis.dietPendingList.length === 0) && (
                        <tr>
                          <td colSpan={2} className="py-16 text-center text-slate-400 italic font-medium">
                            No pending diets
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {stats?.analysis?.dietPendingList && stats.analysis.dietPendingList.length > 0 && (
                    <div className="pt-4 border-t border-slate-50 mt-auto">
                      <Link href="/dietician/clients?status=ACTIVE" className="inline-flex items-center gap-1.5 text-xs font-black text-brand-sage hover:text-brand-forest uppercase tracking-widest cursor-pointer">
                        Update Diets <ChevronRight size={14} />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bento Block 8: Area Distribution Analytics (Spans 2 cols) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-[32px] border border-slate-100 p-6 soft-shadow flex flex-col min-h-[450px]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-brand-clay/10 text-brand-earth rounded-2xl">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-black text-brand-forest text-lg">Top Client Areas</h3>
                <p className="text-slate-400 text-xs font-medium">Active client geographic distribution</p>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 flex items-center justify-center">
              <div className="w-full h-full max-h-[340px]">
                <RegionChart />
              </div>
            </div>
          </div>

          {/* Bento Block 9: Live Activity Feed (Spans 3 cols on desktop) */}
          <div className="col-span-1 md:col-span-2 xl:col-span-3 max-h-[480px]">
            <ActivityFeed />
          </div>

          {/* Bento Box 10: Leads Tracker Tile (Spans 1 col) */}
          <div className="col-span-1 bg-white rounded-[32px] border border-slate-100 p-6 soft-shadow flex flex-col justify-between min-h-[450px] relative overflow-hidden group hover:scale-[1.02] hover:shadow-premium transition-all duration-300">
            {/* Background decorative glow */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-400 rounded-full blur-3xl opacity-10 transition-transform duration-500 group-hover:scale-125"></div>
            
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-black text-brand-forest text-lg">Leads Tracker</h3>
                  <p className="text-slate-400 text-xs font-medium">Incomplete signups</p>
                </div>
              </div>
              
              <div className="my-8 text-center">
                <div className="text-6xl font-black text-indigo-600 tracking-tight mb-2 group-hover:scale-105 transition-transform duration-300">
                  {stats?.leadsCount ?? 0}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Leads</div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Leads represent mobile users who initiated onboarding but have not finished active dietician profiles yet.
              </p>
              <Link href="/dietician/clients?status=LEADS" className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                Follow Up Leads <ChevronRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  count,
  icon,
  color,
  loading,
  glow
}: {
  title: string;
  count: number;
  icon: any;
  color: string;
  loading?: boolean;
  glow: string;
}) {
  return (
    <div className="bg-white rounded-[32px] p-6 border border-slate-100/80 soft-shadow flex items-center justify-between min-h-[120px] relative overflow-hidden group hover:scale-[1.03] hover:shadow-premium transition-all duration-300">
      {/* Dynamic decorative backdrop glow */}
      <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-2xl opacity-15 transition-all group-hover:scale-125 duration-500 ${glow}`}></div>
      
      <div className={`p-4 rounded-2xl transition-all duration-300 group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      
      <div className="text-right z-10">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{title}</div>
        {loading ? (
          <div className="flex justify-end pt-1">
            <Loader2 className="w-6 h-6 animate-spin text-slate-200" />
          </div>
        ) : (
          <div className="text-3.5xl font-black text-brand-forest tracking-tight">{count}</div>
        )}
      </div>
    </div>
  );
}

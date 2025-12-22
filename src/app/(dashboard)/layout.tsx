'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Users, LogOut } from 'lucide-react';
import { clearAuthToken } from '@/lib/api-client';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isLoading } = useAuth(true); // Require authentication

    const handleSignOut = () => {
        clearAuthToken();
        router.push('/login');
    };

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fdfbf7]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2d6a4f] border-r-transparent"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#fdfbf7]">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col shadow-sm">
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#2d6a4f] to-[#d4a373] bg-clip-text text-transparent tracking-tight">
                        NutriVibes
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1.5">
                    <Link href="/dietician/dashboard" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 hover:bg-[#e9edc9] hover:text-[#1b4332] transition-all duration-200 group">
                        <Calendar size={18} className="text-slate-500 group-hover:text-[#1b4332] transition-colors" />
                        <span className="font-medium">Diet Plans</span>
                    </Link>

                    <Link href="/dietician/clients" className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-700 hover:bg-[#e9edc9] hover:text-[#1b4332] transition-all duration-200 group">
                        <Users size={18} className="text-slate-500 group-hover:text-[#1b4332] transition-colors" />
                        <span className="font-medium">Clients</span>
                    </Link>
                </nav>

                {/* Sign Out */}
                <div className="px-3 py-4 border-t border-slate-100">
                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group cursor-pointer"
                    >
                        <LogOut size={20} className="group-hover:text-red-600 transition-colors" />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

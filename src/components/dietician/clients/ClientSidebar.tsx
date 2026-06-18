'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    User,
    Activity,
    Calendar,
    Clock,
    CreditCard,
    Utensils,
    Dumbbell,
    Brain,
    Users,
    MessageCircle,
    Star,
    ClipboardList,
    FileText,
    BookOpen,
    PhoneCall,
    Zap,
    PenTool
} from 'lucide-react';

interface SidebarItem {
    label: string;
    icon: any;
    href: string;
}

export const ClientSidebar = ({ clientId }: { clientId: string }) => {
    const pathname = usePathname();

    const menuItems: SidebarItem[] = [
        { label: 'Profile', icon: User, href: `/dietician/clients/${clientId}` },
        { label: 'Progress', icon: Activity, href: `/dietician/clients/${clientId}/progress` },
        { label: 'Suggest Diet', icon: Utensils, href: `/dietician/clients/${clientId}/suggest-diet` },
        { label: 'Subscription', icon: CreditCard, href: `/dietician/clients/${clientId}/subscription` },
        { label: 'Counselling', icon: MessageCircle, href: `/dietician/clients/${clientId}/counselling` },
        { label: 'Follow Ups', icon: Clock, href: `/dietician/clients/${clientId}/follow-ups` },
    ];

    return (
        <aside className="w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col shrink-0 py-6 px-4">
            <nav className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 text-xs font-bold uppercase tracking-wider rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-700 shadow-sm border border-emerald-500/10 scale-[1.02]'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:scale-[1.01]'
                                }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-colors duration-300 ${isActive ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                                <item.icon size={14} />
                            </div>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

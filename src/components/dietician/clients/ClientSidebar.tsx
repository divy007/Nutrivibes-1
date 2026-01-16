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
        <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col shrink-0">
            <nav className="flex-1 py-1 overflow-y-auto custom-scrollbar">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-2 text-xs font-semibold transition-all duration-200 border-l-4 ${isActive
                                ? 'bg-orange-50 text-orange-600 border-orange-500'
                                : 'text-slate-500 hover:bg-slate-50 border-transparent'
                                }`}
                        >
                            <item.icon size={16} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

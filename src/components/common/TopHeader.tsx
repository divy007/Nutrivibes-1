'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    Search,
    ChevronDown,
    LogOut,
    User as UserIcon,
    Settings,
    Menu,
    X,
    LayoutDashboard,
    Users,
    Activity,
    Calendar
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: any;
    dropdown?: { name: string; href: string }[];
}
import { clearAuthToken } from '@/lib/api-client';

interface TopHeaderProps {
    user: {
        email: string;
        role: string;
        name?: string;
    } | null;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ user }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const profileRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sync search query from URL
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    useEffect(() => {
        if (searchParams) {
            const q = searchParams.get('q');
            if (q) setSearchQuery(q);
        }
    }, [pathname]); // naive sync

    const handleSearch = (query: string) => {
        // If empty, maybe clear? But user might want to see all.
        // Navigate to client list with query
        if (user?.role === 'DIETICIAN') {
            router.push(`/dietician/clients?q=${encodeURIComponent(query)}`);
        }
    };

    const handleSignOut = () => {
        clearAuthToken();
        router.push('/login');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const dieticianNav: NavItem[] = [
        { name: 'Dashboard', href: '/dietician/dashboard', icon: LayoutDashboard },
        {
            name: 'Manage Users',
            href: '/dietician/clients',
            icon: Users,
            dropdown: [
                { name: 'Client List', href: '/dietician/clients' },
                { name: 'Leads', href: '/dietician/clients?status=LEADS' },
                { name: 'Add New Client', href: '/dietician/clients/new' },
                { name: 'Follow-ups', href: '/dietician/clients?status=FOLLOW_UPS' },
            ]
        },
    ];

    const clientNav: NavItem[] = [
        { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
        { name: 'Wellness Audit', href: '/client/health-assessment', icon: Activity },
        { name: 'Diet Plan', href: '/client/diet-plan', icon: Calendar },
    ];

    const navItems: NavItem[] = user?.role === 'DIETICIAN' ? dieticianNav : clientNav;

    const toggleDropdown = (name: string) => {
        if (dropdownOpen === name) setDropdownOpen(null);
        else setDropdownOpen(name);
    };

    return (
        <header className="bg-brand-forest text-white h-[60px] flex items-center px-6 sticky top-0 z-[100] shadow-premium">
            {/* Logo Section */}
            <div className="flex items-center gap-4 border-r border-slate-700/50 pr-6 mr-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-10 w-auto flex items-center justify-center p-1 bg-white rounded-lg shadow-inner overflow-hidden">
                        <img
                            src="/brand-logo.png"
                            alt="NutriVibes Logo"
                            className="h-full w-auto object-contain"
                        />
                    </div>
                </Link>
            </div>

            {/* Navigation Section */}
            <nav className="flex items-center gap-1 flex-1">
                {navItems.map((item) => (
                    <div key={item.name} className="relative group" ref={item.dropdown ? dropdownRef : null}>
                        {item.dropdown ? (
                            <button
                                onClick={() => toggleDropdown(item.name)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${dropdownOpen === item.name || (item.dropdown.some(d => pathname === d.href))
                                    ? 'bg-brand-sage text-white shadow-md'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <span>{item.name}</span>
                                <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen === item.name ? 'rotate-180' : ''}`} />
                            </button>
                        ) : (
                            <Link
                                href={item.href}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${pathname === item.href
                                    ? 'bg-brand-sage text-white shadow-md'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <span>{item.name}</span>
                            </Link>
                        )}

                        {/* Dropdown Menu */}
                        {item.dropdown && dropdownOpen === item.name && (
                            <div className="absolute top-[110%] left-0 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 py-2 py-text-slate-800 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                                {item.dropdown.map((subItem) => (
                                    <Link
                                        key={subItem.name}
                                        href={subItem.href}
                                        onClick={() => setDropdownOpen(null)}
                                        className={`block px-4 py-2.5 text-sm transition-colors ${pathname === subItem.href
                                            ? 'bg-orange-50 text-orange-600 font-bold'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {subItem.name}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Selected Indicator */}
                        {((!item.dropdown && pathname === item.href) || (item.dropdown && item.dropdown.some(d => pathname === d.href))) && (
                            <div className="absolute -bottom-[20px] left-4 right-4 h-1 bg-brand-earth rounded-t-full shadow-[0_0_10px_rgba(188,108,37,0.5)]" />
                        )}
                    </div>
                ))}
            </nav>

            {/* Right Side: Search & Profile */}
            <div className="flex items-center gap-6">
                {/* Global Search */}
                <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-sage transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by ID, Name, Contact..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch(searchQuery);
                            }
                        }}
                        className="bg-white/10 border border-white/10 rounded-full pl-11 pr-4 py-2 text-sm w-[300px] focus:outline-none focus:ring-2 focus:ring-brand-sage focus:bg-white focus:text-slate-800 transition-all placeholder:text-slate-400"
                    />
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2 group p-1 rounded-full hover:bg-white/10 transition-all border border-transparent hover:border-white/20"
                    >
                        <div className="w-8 h-8 rounded-full bg-brand-sage flex items-center justify-center font-bold text-white shadow-md group-hover:scale-105 transition-transform">
                            {user?.email?.[0].toUpperCase() || 'A'}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 group-hover:text-white transition-all duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {profileOpen && (
                        <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-slate-50 mb-2">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Logged in as</p>
                                <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                            </div>

                            <Link
                                href={user?.role === 'DIETICIAN' ? '/dietician/profile' : '/client/profile'}
                                onClick={() => setProfileOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition-colors"
                            >
                                <UserIcon size={18} />
                                <span className="font-semibold">Edit Profile</span>
                            </Link>

                            <div className="h-px bg-slate-100 my-2 mx-2"></div>

                            <button
                                onClick={handleSignOut}
                                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="font-bold">Sign out</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

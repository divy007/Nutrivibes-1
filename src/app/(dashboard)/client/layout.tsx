'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { User, Calendar, LogOut, ChevronDown, LayoutDashboard, Activity } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth(true);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    // Strict Role-Based View Separation
    useEffect(() => {
        if (user && user.role !== 'CLIENT') {
            router.push('/dietician/dashboard');
        }
    }, [user, router]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user || user.role !== 'CLIENT') {
        return null; // Or a loading spinner
    }

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const tabs = [
        { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
        { name: 'Health Assessment', path: '/client/health-assessment', icon: Activity },
        { name: 'Diet Plan', path: '/client/diet-plan', icon: Calendar },
    ];

    return (
        <div className="h-full">
            {children}
        </div>
    );
}

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { clearAuthToken } from '@/lib/api-client';
import { TopHeader } from '@/components/common/TopHeader';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isLoading, user } = useAuth(true); // Require authentication

    const handleSignOut = () => {
        clearAuthToken();
        router.push('/login');
    };

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <div className="text-center space-y-4">
                    <img
                        src="/brand-logo.png"
                        alt="NutriVibes"
                        className="h-20 w-auto mx-auto animate-pulse"
                    />
                    <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                        <div className="h-1 w-1 bg-orange-500 rounded-full animate-bounce" />
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Show TopHeader for all authenticated users */}
            {user && <TopHeader user={user} />}
            <main className="flex-1 overflow-hidden bg-[#FCFCF9]">
                <div className="h-full overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

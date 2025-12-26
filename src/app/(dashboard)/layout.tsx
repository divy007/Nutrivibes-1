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
            <div className="flex h-screen items-center justify-center bg-[#fdfbf7]">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
                    <p className="mt-4 text-slate-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            <TopHeader user={user} />
            <main className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { clearAuthToken } from '@/lib/api-client';

export default function DieticianLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isLoading } = useAuth(true);

    useEffect(() => {
        if (!isLoading && user && user.role !== 'DIETICIAN') {
            // Strict enforcement: if you are not a dietician, you cannot be here.
            // Clear token to avoid confusion and redirect to login.
            clearAuthToken();
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#fdfbf7]">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!user || user.role !== 'DIETICIAN') {
        return null; // Will redirect via useEffect
    }

    return <>{children}</>;
}

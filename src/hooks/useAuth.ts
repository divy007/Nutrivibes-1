'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api-client';

export function useAuth(requireAuth: boolean = true) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        const hasToken = !!token;

        setIsAuthenticated(hasToken);

        if (requireAuth && !hasToken) {
            // Redirect to login if auth required but no token
            router.push('/login');
        } else if (!requireAuth && hasToken) {
            // Redirect to dashboard if on login page but already authenticated
            router.push('/dietician/dashboard');
        }
    }, [requireAuth, router]);

    return { isAuthenticated, isLoading: isAuthenticated === null };
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken, setAuthToken, clearAuthToken, decodeToken } from '@/lib/api-client';

interface User {
    userId: string;
    email: string;
    name?: string;
    role: 'DIETICIAN' | 'CLIENT';
    isProfileComplete?: boolean;
}

export function useAuth(requireAuth: boolean = true) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = getAuthToken();
        const hasToken = !!token;

        setIsAuthenticated(hasToken);

        if (hasToken) {
            // Decode to find role
            const payload = decodeToken(token) as User;
            setUser(payload);

            // Repair session if relevant cookie is missing
            if (payload && payload.role) {
                let cookieName = '';
                if (payload.role === 'DIETICIAN') cookieName = 'token_dietician';
                else if (payload.role === 'CLIENT') cookieName = 'token_client';

                if (cookieName) {
                    const cookieMatch = document.cookie.match(new RegExp(`(^|;)\\s*${cookieName}\\s*=\\s*([^;]+)`));
                    if (!cookieMatch) {
                        setAuthToken(token); // This will set the correct cookie
                    }
                }
            }

            if (!requireAuth) {
                // Redirect if already logged in (e.g. visiting /login)
                if (payload?.role === 'CLIENT') {
                    router.push(payload.isProfileComplete ? '/client/dashboard' : '/client/profile');
                } else {
                    router.push('/dietician/dashboard');
                }
            }
        }

        if (requireAuth && !hasToken) {
            // Redirect to login if auth required but no token
            router.push('/login');
        }
    }, [requireAuth, router]);

    const logout = () => {
        clearAuthToken();
        setIsAuthenticated(false);
        setUser(null);
        router.push('/login');
    };

    return { isAuthenticated, isLoading: isAuthenticated === null, user, logout };
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api-client';

interface User {
    userId: string;
    email: string;
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
            try {
                // Decode token payload
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                const payload = JSON.parse(jsonPayload) as User;
                setUser(payload);

                if (!requireAuth) {
                    // Redirect if already logged in (e.g. visiting /login)
                    if (payload.role === 'CLIENT') {
                        router.push(payload.isProfileComplete ? '/client/dashboard' : '/client/profile');
                    } else {
                        router.push('/dietician/dashboard');
                    }
                }
            } catch (error) {
                console.error('Failed to decode token:', error);
            }
        }

        if (requireAuth && !hasToken) {
            // Redirect to login if auth required but no token
            router.push('/login');
        }
    }, [requireAuth, router]);

    return { isAuthenticated, isLoading: isAuthenticated === null, user };
}

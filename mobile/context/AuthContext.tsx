
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken as setMobileToken, clearAuthToken } from '@/lib/api-client';

const AUTH_TOKEN_KEY = 'auth_token_client';

type User = {
    _id: string;
    name: string;
    email: string;
    role: string;
    isProfileComplete: boolean;
    // add other fields as needed
} | null;

type AuthContextType = {
    user: User;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => { },
    logout: async () => { },
    refreshUser: async () => { },
});

export function useAuth() {
    return useContext(AuthContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
            console.log('SessionProvider: Stored token found:', !!token);
            if (token) {
                setMobileToken(token);
                const profile: any = await api.get('/api/clients/me');
                console.log('SessionProvider: Profile fetched:', profile?.name);
                setUser(profile);
            }
        } catch (error) {
            console.error('SessionProvider: Auth check failed:', error);
            await clearAuthToken();
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    // Auth Guard
    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(tabs)';
        const inLoginGroup = segments[0] === 'login';

        console.log(`Auth Guard: User=${!!user}, Loading=${loading}, Segment=${segments[0]}`);

        if (!user && inAuthGroup) {
            console.log('Auth Guard: Redirecting to Login');
            router.replace('/login');
        } else if (user && inLoginGroup) {
            console.log('Auth Guard: Redirecting to Dashboard');
            if (!user.isProfileComplete) {
                router.replace('/complete-profile' as any);
            } else {
                router.replace('/(tabs)' as any);
            }
        }
    }, [user, loading, segments]);

    const login = async (token: string) => {
        console.log('SessionProvider: Login start');
        await setMobileToken(token);
        try {
            const profile: any = await api.get('/api/clients/me');
            setUser(profile);
            // Navigation handled by Auth Guard effect
        } catch (err) {
            console.error('Login failed:', err);
            throw err;
        }
    };

    const logout = async () => {
        await clearAuthToken();
        setUser(null);
        // Navigation handled by Auth Guard effect
    };

    const refreshUser = async () => {
        try {
            const profile: any = await api.get('/api/clients/me');
            setUser(profile);
        } catch (error) {
            console.error('Refresh user failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

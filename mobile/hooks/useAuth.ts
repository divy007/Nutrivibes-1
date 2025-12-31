import { useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { api, setAuthToken as setMobileToken, clearAuthToken } from '@/lib/api-client';

const AUTH_TOKEN_KEY = 'auth_token_client';

export function useAuth() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        checkToken();
    }, []);

    const checkToken = async () => {
        try {
            const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
            console.log('Stored token found:', !!token);
            if (token) {
                setMobileToken(token); // Ensure api client has it
                // In a real app, you would validate the token or fetch user profile here
                const profile = await api.get('/api/clients/me');
                console.log('Profile fetched successfully:', profile?.name);
                setUser(profile);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await clearAuthToken();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('Auth Guard - User:', !!user, 'Loading:', loading, 'Segments:', segments);
        if (loading) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!user && inAuthGroup) {
            console.log('Redirecting to login');
            // Redirect to login if not authenticated and trying to access tabs
            router.replace('/login');
        } else if (user && segments[0] === 'login') {
            console.log('Redirecting to dashboard');
            // Redirect to home if authenticated and trying to access login
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    const login = async (token: string) => {
        console.log('useAuth login start');
        await setMobileToken(token);
        try {
            const profile = await api.get('/api/clients/me');
            console.log('useAuth profile fetched:', profile?.name);
            setUser(profile);
            // Explicitly replace if the effect doesn't catch it fast enough
            console.log('useAuth replacing route to tabs');
            router.replace('/(tabs)');
        } catch (err) {
            console.error('useAuth login sync failed:', err);
            throw err;
        }
    };

    const logout = async () => {
        await clearAuthToken();
        setUser(null);
        router.replace('/login');
    };

    return { user, loading, login, logout };
}

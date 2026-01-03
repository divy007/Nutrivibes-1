import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const AUTH_TOKEN_KEY = 'auth_token_client';

// NOTE: In production, this should be an environment variable.
// For Expo Go, use your computer's local IP (e.g., http://192.168.x.x:3000)
// For emulator, http://10.0.2.2:3000 (Android) or http://localhost:3000 (iOS)
const BASE_URL = 'https://nutrivibes-1.vercel.app';

export const setAuthToken = async (token: string): Promise<void> => {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async (): Promise<string | null> => {
    return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
};

export const clearAuthToken = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};

interface RequestOptions extends RequestInit {
    body?: any;
}

export const apiRequest = async <T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<T> => {
    const token = await getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Set a 10 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const config: RequestInit = {
        ...options,
        headers,
        signal: controller.signal,
    };

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    }

    // Ensure endpoint starts with /
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${BASE_URL}${path}`;

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        const contentType = response.headers.get('content-type');
        let data: any;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            if (!response.ok) {
                throw new Error(text || `Error ${response.status}: ${response.statusText}`);
            }
            return text as unknown as T;
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Error ${response.status}: ${response.statusText}`);
        }

        return data as T;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check if the server is reachable.');
        }
        if (error instanceof Error) {
            // Provide a more descriptive error for JSON parse failures
            if (error.message.includes('JSON Parse error')) {
                throw new Error('Received an invalid response from the server. This usually means the API URL is incorrect or the server is down.');
            }
            throw error;
        }
        throw new Error('An unknown error occurred');
    }
};

export const api = {
    get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: unknown) =>
        apiRequest<T>(endpoint, { method: 'POST', body }),
    patch: <T>(endpoint: string, body: unknown) =>
        apiRequest<T>(endpoint, { method: 'PATCH', body }),
    del: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

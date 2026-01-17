import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token_client';

// ============================================
// API CONFIGURATION
// ============================================
const PROD_URL = 'https://nutrivibesbymansi.vercel.app';
const LOCAL_URL = 'http://192.168.1.6:3000'; // Change to your Mac's IP for local dev

// Set this to true for production, false for local development
const IS_PROD = true;

const BASE_URL = IS_PROD ? PROD_URL : LOCAL_URL;

console.log(`🌐 API Mode: ${IS_PROD ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`🔗 API URL: ${BASE_URL}`);

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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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

    // Debug: Log the request
    console.log(`📡 API Request: ${config.method || 'GET'} ${url}`);

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
                // If it's HTML, it's likely a 404/500 page from Vercel/Next.js
                if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
                    throw new Error(`Error ${response.status}: The requested page could not be found or the server returned an error page.`);
                }
                throw new Error(text.substring(0, 200) || `Error ${response.status}: ${response.statusText}`);
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

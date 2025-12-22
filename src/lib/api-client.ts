type APIResponse<T> = T;

const AUTH_TOKEN_KEY = 'auth_token';

export const setAuthToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
};

export const clearAuthToken = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    }
};

interface RequestOptions extends RequestInit {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
}

export const apiRequest = async <T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<APIResponse<T>> => {
    const token = getAuthToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
    };

    if (options.body && typeof options.body !== 'string') {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(endpoint, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || 'API request failed');
        }

        return data as APIResponse<T>;
    } catch (error) {
        if (error instanceof Error) {
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

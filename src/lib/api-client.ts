type APIResponse<T> = T;

const AUTH_TOKEN_KEY_DIETICIAN = 'auth_token_dietician';
const AUTH_TOKEN_KEY_CLIENT = 'auth_token_client';

const COOKIE_NAME_DIETICIAN = 'token_dietician';
const COOKIE_NAME_CLIENT = 'token_client';

interface DecodedToken {
    role: 'DIETICIAN' | 'CLIENT';
    [key: string]: any;
}

export const decodeToken = (token: string): DecodedToken | null => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
};

export const setAuthToken = (token: string): void => {
    if (typeof window !== 'undefined') {
        const decoded = decodeToken(token);
        if (!decoded || !decoded.role) return;

        if (decoded.role === 'DIETICIAN') {
            localStorage.setItem(AUTH_TOKEN_KEY_DIETICIAN, token);
            document.cookie = `${COOKIE_NAME_DIETICIAN}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=lax`;
        } else if (decoded.role === 'CLIENT') {
            localStorage.setItem(AUTH_TOKEN_KEY_CLIENT, token);
            document.cookie = `${COOKIE_NAME_CLIENT}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; sameSite=lax`;
        }
    }
};

export const getAuthToken = (): string | null => {
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;

        // Strict context check
        if (path.startsWith('/dietician')) {
            return localStorage.getItem(AUTH_TOKEN_KEY_DIETICIAN);
        } else if (path.startsWith('/client')) {
            return localStorage.getItem(AUTH_TOKEN_KEY_CLIENT);
        }

        // On neutral ground (e.g. /login), return null to allow fresh login/multi-login
        return null;
    }
    return null;
};

export const clearAuthToken = (): void => {
    if (typeof window !== 'undefined') {
        const path = window.location.pathname;

        if (path.startsWith('/dietician')) {
            localStorage.removeItem(AUTH_TOKEN_KEY_DIETICIAN);
            document.cookie = `${COOKIE_NAME_DIETICIAN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } else if (path.startsWith('/client')) {
            localStorage.removeItem(AUTH_TOKEN_KEY_CLIENT);
            document.cookie = `${COOKIE_NAME_CLIENT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        } else {
            // Clear all if unknown context (safe logout)
            localStorage.removeItem(AUTH_TOKEN_KEY_DIETICIAN);
            localStorage.removeItem(AUTH_TOKEN_KEY_CLIENT);
            document.cookie = `${COOKIE_NAME_DIETICIAN}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            document.cookie = `${COOKIE_NAME_CLIENT}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

            // Also clear legacy
            localStorage.removeItem('auth_token');
            document.cookie = `token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
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
    put: <T>(endpoint: string, body: unknown) =>
        apiRequest<T>(endpoint, { method: 'PUT', body }),
    del: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};

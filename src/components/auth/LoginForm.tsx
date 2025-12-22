'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import { api, setAuthToken } from '@/lib/api-client';

interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    user: {
        role: 'DIETICIAN' | 'CLIENT';
    };
}

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const isFormValid = validateEmail(email) && password.length >= 6;

    const handleEmailBlur = () => {
        if (email && !validateEmail(email)) {
            setError('Please enter a valid email address');
        }
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (value: string) => void
    ) => {
        setter(e.target.value);
        if (error) setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post<LoginResponse>('/api/auth/login', {
                email,
                password,
            });

            if (response.success && response.token) {
                setAuthToken(response.token);

                // Redirect based on role
                if (response.user.role === 'DIETICIAN') {
                    router.push('/dietician/dashboard');
                } else {
                    router.push('/client/profile');
                }
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-[#1b4332]">Welcome to Nutrivibes!</h1>
                <p className="text-gray-500">Sign in to continue</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[#1b4332] flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                        </label>
                        <div className="group relative">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help transition-colors hover:text-[#1b4332]" />
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-[#1b4332] text-white text-[10px] rounded shadow-lg z-20">
                                Please enter a valid email format (e.g., name@domain.com)
                                <div className="absolute top-full right-1 border-4 border-transparent border-t-[#1b4332]"></div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => handleInputChange(e, setEmail)}
                            onBlur={handleEmailBlur}
                            className="w-full px-4 py-2 text-[#1b4332] border border-[#1b4332]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all placeholder-[#1b4332]/50"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[#1b4332] flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                        </label>
                        <div className="group relative">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help transition-colors hover:text-[#1b4332]" />
                            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-[#1b4332] text-white text-[10px] rounded shadow-lg z-20">
                                Password must be at least 6 characters
                                <div className="absolute top-full right-1 border-4 border-transparent border-t-[#1b4332]"></div>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => handleInputChange(e, setPassword)}
                            className="w-full px-4 py-2 text-[#1b4332] border border-[#1b4332]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b4332] focus:border-transparent transition-all pr-10 placeholder-[#1b4332]/50"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1b4332] transition-colors"
                        >
                            {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="w-full bg-[#1b4332] hover:bg-[#143225] text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 cursor-pointer"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>
        </div>
    );
}

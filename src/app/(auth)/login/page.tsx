'use client';

import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const { isLoading } = useAuth(false); // Redirect if already authenticated

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#1b4332]" />
                <p className="text-[#1b4332] font-medium">Loading...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <LoginForm />

            <div className="text-center text-sm text-white">
                <p>&copy; {new Date().getFullYear()} Nutrivibes.</p>
            </div>
        </div>
    );
}

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api-client';

interface ClientProfile {
    name: string;
    email: string;
}

export default function ClientDashboard() {
    const { user } = useAuth(true);
    const [profile, setProfile] = useState<ClientProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get<ClientProfile>('/api/clients/me');
                setProfile(data);
            } catch (error) {
                console.error('Failed to fetch profile:', error);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-[#1b4332] mb-4">
                Welcome back, {profile?.name || user?.email}
            </h1>
            <p>This is your dashboard. (Work in progress)</p>
        </div>
    );
}

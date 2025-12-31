import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClientInfo } from '@/types';
import { api } from '@/lib/api-client';

interface ClientDataContextType {
    clientInfo: ClientInfo | null;
    loading: boolean;
    refreshClient: () => Promise<void>;
    updateClientLocal: (updates: Partial<ClientInfo>) => void;
}

const ClientDataContext = createContext<ClientDataContextType | undefined>(undefined);

export const ClientDataProvider: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(true);

    const calculateAge = (dob: string | Date | undefined) => {
        if (!dob) return undefined;
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const fetchClient = async () => {
        try {
            const [data, assessmentData] = await Promise.all([
                api.get<any>(`/api/clients/${id}`),
                api.get<any>(`/api/clients/${id}/health-assessment`).catch(() => null)
            ]);

            setClientInfo({
                id: data.clientId || `#${data._id.slice(-8)}`,
                _id: data._id,
                name: data.name,
                email: data.email,
                age: data.age || calculateAge(data.dob),
                gender: data.gender,
                height: data.height,
                weight: data.weight,
                idealWeight: data.idealWeight,
                phone: data.phone,
                dob: data.dob,
                city: data.city,
                state: data.state,
                preferences: (data.dietaryPreferences && data.dietaryPreferences.length > 0)
                    ? data.dietaryPreferences.join(', ')
                    : 'N/A',
                status: data.status || 'ACTIVE',
                assessment: assessmentData
            });
        } catch (error) {
            console.error('Failed to fetch client:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchClient();
    }, [id]);

    const updateClientLocal = (updates: Partial<ClientInfo>) => {
        setClientInfo(prev => prev ? { ...prev, ...updates } : null);
    };

    return (
        <ClientDataContext.Provider value={{ clientInfo, loading, refreshClient: fetchClient, updateClientLocal }}>
            {children}
        </ClientDataContext.Provider>
    );
};

export const useClientData = () => {
    const context = useContext(ClientDataContext);
    if (!context) throw new Error('useClientData must be used within ClientDataProvider');
    return context;
};

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

    const fetchClient = async () => {
        try {
            const data = await api.get<any>(`/api/clients/${id}`);
            setClientInfo({
                id: data.clientId || `#${data._id.slice(-8)}`,
                name: data.name,
                email: data.email,
                age: data.age,
                gender: data.gender,
                height: data.height,
                weight: data.weight,
                phone: data.phone,
                preferences: data.preferences,
                plan: data.plan,
                status: data.status || 'ACTIVE'
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

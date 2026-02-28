import { useRef, useState, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { getLocalDateString } from '@/lib/date-utils';

export const useDashboardData = (enabled: boolean = true) => {
    const [date, setDate] = useState(getLocalDateString());
    const appState = useRef(AppState.currentState);
    const queryClient = useQueryClient();

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                // App has come to the foreground
                const newDate = getLocalDateString();
                if (newDate !== date) {
                    setDate(newDate);
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [date, queryClient]);

    return useQuery({
        queryKey: ['dashboard', date], // Cache by reactive date
        queryFn: async () => {
            const data = await api.get<any>(`/api/clients/me/dashboard?date=${date}`);
            return data;
        },
        enabled,
    });
};


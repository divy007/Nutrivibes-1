import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { getLocalDateString } from '@/lib/date-utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useDashboardData = (enabled: boolean = true) => {
    return useQuery({
        queryKey: ['dashboard', getLocalDateString()], // Cache by date
        queryFn: async () => {
            const today = getLocalDateString();
            const data = await api.get<any>(`/api/clients/me/dashboard?date=${today}`);

            // Check welcome banner logic here or keep it in component?
            // Keeping side effects like AsyncStorage checks in the query function is not ideal but feasible.
            // Better to return the raw data.

            return data;
        },
        enabled,
    });
};

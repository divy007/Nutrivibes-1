import { useColorScheme as useNativeColorScheme } from 'react-native';
import Colors from '@/constants/Colors';

export function useColorScheme(): keyof typeof Colors {
    return 'light';
}

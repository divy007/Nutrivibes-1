import { Stack } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ClientsLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.background,
        },
        headerTitleStyle: {
          fontWeight: '900',
          color: theme.brandForest,
        },
        headerTintColor: theme.brandForest,
        headerBackTitleVisible: false,
      } as any}>
      <Stack.Screen name="index" options={{ title: 'My Clients' }} />
      <Stack.Screen name="[id]" options={{ title: 'Client Profile' }} />
      <Stack.Screen name="[id]/suggest-diet" options={{ title: 'Diet Planner' }} />
    </Stack>
  );
}

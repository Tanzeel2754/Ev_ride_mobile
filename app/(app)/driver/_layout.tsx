import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

export default function DriverLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontFamily: 'PlusJakartaSans_700Bold' },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="available" options={{ headerShown: false }} />
      <Stack.Screen name="active" options={{ title: 'Active ride' }} />
      <Stack.Screen name="onboarding" options={{ title: 'Driver onboarding' }} />
      <Stack.Screen name="vehicles" options={{ title: 'Vehicles' }} />
      <Stack.Screen name="vehicle" options={{ title: 'Vehicle' }} />
      <Stack.Screen name="profile" options={{ title: 'Driver profile' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { colors } from '../../../src/theme/colors';

export default function PassengerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.charcoal,
        headerTitleStyle: { fontFamily: 'PlusJakartaSans_700Bold' },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="book" options={{ title: 'Plan Your Ride', headerShadowVisible: false }} />
      <Stack.Screen name="tracking" options={{ title: 'Live trip' }} />
      <Stack.Screen name="history" options={{ title: 'Booking' }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}

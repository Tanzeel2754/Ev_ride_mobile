import { Redirect, Stack } from 'expo-router';
import { LoadingBlock, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../../src/theme/colors';

export default function AppLayout() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Starting EVRide…" />
      </Screen>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/splash" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.charcoal,
        headerTitleStyle: {
          fontFamily: 'PlusJakartaSans_800ExtraBold',
          fontSize: 17,
        },
        contentStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="mode" options={{ title: 'EVRide', headerShown: false }} />
      <Stack.Screen name="passenger" options={{ headerShown: false }} />
      <Stack.Screen name="driver" options={{ headerShown: false }} />
      <Stack.Screen name="contact" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ title: 'Trip chat' }} />
    </Stack>
  );
}

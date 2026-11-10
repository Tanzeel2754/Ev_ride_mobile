import { Tabs } from 'expo-router';
import { DriverSessionProvider } from '../../../../src/hooks/useDriverSession';

export default function DriverTabsLayout() {
  return (
    <DriverSessionProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none', height: 0 },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Ride requests' }} />
        <Tabs.Screen name="demand" options={{ title: 'Demand' }} />
        <Tabs.Screen name="performance" options={{ title: 'Performance' }} />
        <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      </Tabs>
    </DriverSessionProvider>
  );
}

import { Redirect } from 'expo-router';
import { LoadingBlock, Screen } from '../src/components/ui';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Starting EV Ride…" />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(app)/passenger" />;
  }

  return <Redirect href="/(auth)/splash" />;
}

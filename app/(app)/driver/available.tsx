import { Redirect } from 'expo-router';

/** Legacy route — ride requests now live under driver tabs. */
export default function AvailableRidesRedirect() {
  return <Redirect href="/(app)/driver/(tabs)" />;
}

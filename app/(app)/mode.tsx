import { Redirect } from 'expo-router';

/** Mode picker removed — land on passenger home by default. */
export default function ModeRedirect() {
  return <Redirect href="/(app)/passenger" />;
}

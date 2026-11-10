import { Redirect } from 'expo-router';

/** Driver home lands on Ride requests tab (Careem-style shell). */
export default function DriverIndexRedirect() {
  return <Redirect href="/(app)/driver/(tabs)" />;
}

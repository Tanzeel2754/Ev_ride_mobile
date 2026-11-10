import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'evride_onboarding_done';

export async function hasCompletedOnboarding() {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setOnboardingCompleted() {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    // ignore
  }
}

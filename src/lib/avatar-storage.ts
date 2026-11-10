import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (email?: string | null) =>
  `evride_avatar_${(email || 'guest').trim().toLowerCase()}`;

export async function getLocalAvatarUri(email?: string | null) {
  try {
    return (await AsyncStorage.getItem(keyFor(email))) || null;
  } catch {
    return null;
  }
}

export async function setLocalAvatarUri(email: string | null | undefined, uri: string) {
  await AsyncStorage.setItem(keyFor(email), uri);
}

export async function clearLocalAvatarUri(email?: string | null) {
  await AsyncStorage.removeItem(keyFor(email));
}

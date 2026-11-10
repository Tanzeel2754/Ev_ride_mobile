import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export type PickedDocument = {
  uri: string;
  name: string;
  mimeType: string;
};

export async function pickDocument(): Promise<PickedDocument | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['image/*', 'application/pdf'],
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.name || 'document',
    mimeType: asset.mimeType || 'application/octet-stream',
  };
}

/** Prefer camera-roll image picker for profile photos. */
export async function pickImage(): Promise<PickedDocument | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Photo library permission is required to upload a profile picture.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const uri = asset.uri;
  const name = uri.split('/').pop() || `photo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType || (name.endsWith('.png') ? 'image/png' : 'image/jpeg');

  return { uri, name, mimeType };
}

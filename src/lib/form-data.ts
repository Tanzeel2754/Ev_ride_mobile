import { Platform } from 'react-native';

function normalizeNativeUri(uri: string) {
  // Keep content:// and file:// as-is; only prefix bare paths.
  if (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  ) {
    return uri;
  }
  return `file://${uri}`;
}

/**
 * Append a picked local file to FormData in a way that works on
 * native (uri/name/type) and web (real Blob/File).
 */
export async function appendPickedFile(
  form: FormData,
  fieldName: string,
  fileUri: string,
  fileName: string,
  mimeType: string,
) {
  const name = fileName.includes('.')
    ? fileName
    : mimeType.includes('pdf')
      ? `${fileName || 'document'}.pdf`
      : `${fileName || 'photo'}.jpg`;
  const type = mimeType || 'application/octet-stream';

  if (Platform.OS === 'web') {
    const res = await fetch(fileUri);
    const blob = await res.blob();
    const file =
      typeof File !== 'undefined'
        ? new File([blob], name, { type: blob.type || type })
        : blob;
    form.append(fieldName, file, name);
    return form;
  }

  // React Native XHR multipart part
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form.append(fieldName, {
    uri: normalizeNativeUri(fileUri),
    name,
    type,
  } as any);

  return form;
}

export async function buildFileFormData(
  fileUri: string,
  fileName: string,
  mimeType: string,
  fieldName = 'file',
) {
  const form = new FormData();
  await appendPickedFile(form, fieldName, fileUri, fileName, mimeType);
  return form;
}

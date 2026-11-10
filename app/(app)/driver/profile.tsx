import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import {
  Card,
  ErrorBanner,
  Field,
  Label,
  LoadingBlock,
  PrimaryButton,
  Screen,
  SoftButton,
  Title,
} from '../../../src/components/ui';
import { getErrorMessage } from '../../../src/api/client';
import {
  deleteProfileImage,
  getDriverProfile,
  getDriverRegistrationStatus,
  updateDriverProfile,
  uploadProfileImage,
} from '../../../src/api/driver';
import { useAuth } from '../../../src/context/AuthContext';
import type {
  GetDriverProfileByIdResponse,
  GetDriverRegistrationStatusResponse,
} from '../../../src/types/api';
import { VerificationStatusLabel } from '../../../src/types/enums';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { pickImage } from '../../../src/lib/pick-document';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

export default function DriverProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const { spacing } = useResponsive();
  const type = useTypography();
  const [profile, setProfile] = useState<GetDriverProfileByIdResponse | null>(null);
  const [registration, setRegistration] = useState<GetDriverRegistrationStatusResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [license, setLicense] = useState('');
  const [expiry, setExpiry] = useState('');
  const [city, setCity] = useState('');
  const [about, setAbout] = useState('');

  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [nextProfile, nextRegistration] = await Promise.all([
        getDriverProfile(),
        getDriverRegistrationStatus().catch(() => null),
      ]);
      setProfile(nextProfile);
      setRegistration(nextRegistration);
      setFirstName(nextProfile.firstName ?? '');
      setLastName(nextProfile.lastName ?? '');
      setLicense(nextProfile.drivingLicenseNumber ?? '');
      setExpiry(nextProfile.licenseExpiryOn?.slice(0, 10) ?? '');
      setCity(nextProfile.city ?? '');
      setAbout(nextProfile.about ?? '');
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load driver profile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const result = await updateDriverProfile({
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
        drivingLicenseNumber: license.trim() || null,
        licenseExpiryOn: expiry.trim() || null,
        city: city.trim() || null,
        about: about.trim() || null,
      });
      if (!result.isSuccess) throw new Error(result.message || 'Could not update profile');
      setEditing(false);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update profile'));
    } finally {
      setSaving(false);
    }
  }

  async function onUploadPhoto() {
    setError(null);
    try {
      const file = await pickImage();
      if (!file) return;
      setPhotoBusy(true);
      const result = await uploadProfileImage(file.uri, file.name, file.mimeType);
      if (!result.isSuccess) throw new Error(result.message || 'Upload failed');
      // Keep rider avatar in sync when driver photo changes
      try {
        const { setLocalAvatarUri } = await import('../../../src/lib/avatar-storage');
        await setLocalAvatarUri(session?.email, file.uri);
      } catch {
        // ignore local sync failures
      }
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not upload photo'));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function onRemovePhoto() {
    setPhotoBusy(true);
    setError(null);
    try {
      const result = await deleteProfileImage();
      if (!result.isSuccess) throw new Error(result.message || 'Could not remove photo');
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not remove photo'));
    } finally {
      setPhotoBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <LoadingBlock />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Label>Driver</Label>
        <Title>Profile</Title>
        <ErrorBanner message={error} />
        <Card accent>
          <Pressable
            onPress={profile ? onUploadPhoto : undefined}
            disabled={!profile || photoBusy}
            style={{ alignSelf: 'flex-start', marginBottom: spacing.md }}
          >
            {profile?.profileImageUrl ? (
              <Image
                source={{ uri: profile.profileImageUrl }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: colors.surfaceMuted,
                  borderWidth: 3,
                  borderColor: colors.green,
                }}
              />
            ) : (
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: colors.greenLight,
                  borderWidth: 2,
                  borderColor: colors.green,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[type.h2, { color: colors.green }]}>
                  {(displayName || session?.name || 'D').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={[type.caption, { marginTop: spacing.xs, color: colors.green }]}>
              {photoBusy ? 'Uploading…' : 'Tap to change photo'}
            </Text>
          </Pressable>
          <Row label="Email" value={profile?.email || session?.email || '—'} />
          <Row label="Name" value={displayName || session?.name || '—'} />
          {profile?.phoneNumber ? <Row label="Phone" value={profile.phoneNumber} /> : null}
          {profile ? (
            <>
              <Row
                label="Verification"
                value={
                  VerificationStatusLabel[profile.verificationStatusId] ??
                  String(profile.verificationStatusId)
                }
              />
              <Row label="License" value={profile.drivingLicenseNumber || '—'} />
              <Row label="City" value={profile.city || '—'} />
              <Row label="Online" value={profile.isOnline ? 'Yes' : 'No'} />
              <Row label="Rating" value={String(profile.averageRating)} />
              <Row label="Completed trips" value={String(profile.completedTripsCount)} />
              {profile.about ? <Row label="About" value={profile.about} /> : null}
              {profile.rejectionReason ? (
                <Row label="Rejection" value={profile.rejectionReason} />
              ) : null}
            </>
          ) : (
            <Text style={type.caption}>Not registered as driver yet.</Text>
          )}
        </Card>
        {profile ? (
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <SoftButton
              title={profile.profileImageUrl ? 'Replace photo' : 'Upload photo'}
              onPress={onUploadPhoto}
              loading={photoBusy}
            />
            {profile.profileImageUrl ? (
              <SoftButton title="Remove photo" onPress={onRemovePhoto} disabled={photoBusy} />
            ) : null}
            <SoftButton title={editing ? 'Close editor' : 'Edit profile'} onPress={() => setEditing((v) => !v)} />
          </View>
        ) : null}
        {editing ? (
          <Card>
            <Text style={[type.h3, { marginBottom: spacing.sm }]}>Edit profile</Text>
            <Field placeholder="First name" value={firstName} onChangeText={setFirstName} />
            <Field placeholder="Last name" value={lastName} onChangeText={setLastName} />
            <Field placeholder="License number" value={license} onChangeText={setLicense} />
            <Field placeholder="License expiry (YYYY-MM-DD)" value={expiry} onChangeText={setExpiry} />
            <Field placeholder="City" value={city} onChangeText={setCity} />
            <Field placeholder="About" value={about} onChangeText={setAbout} multiline />
            <View style={{ marginTop: spacing.md }}>
              <PrimaryButton title="Save profile" onPress={onSave} loading={saving} />
            </View>
          </Card>
        ) : null}
        {registration ? (
          <Card>
            <Text style={[type.h3, { marginBottom: spacing.sm }]}>Documents</Text>
            <Row label="Registered" value={registration.isRegistered ? 'Yes' : 'No'} />
            <Row
              label="License document"
              value={registration.hasDrivingLicence ? 'Uploaded' : 'Pending'}
            />
            <Row label="ID document" value={registration.hasIdDocument ? 'Uploaded' : 'Pending'} />
            {registration.verificationStatusId != null ? (
              <Row
                label="Registration status"
                value={
                  VerificationStatusLabel[registration.verificationStatusId] ??
                  String(registration.verificationStatusId)
                }
              />
            ) : null}
            {registration.rejectionReason ? (
              <Row label="Rejection" value={registration.rejectionReason} />
            ) : null}
          </Card>
        ) : null}
        <View style={{ gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <PrimaryButton
            title="Switch to rider mode"
            onPress={() => router.replace('/(app)/passenger')}
          />
          <SoftButton title="Contact us" onPress={() => router.push('/(app)/contact')} />
          <SoftButton
            title="Onboarding"
            onPress={() => router.push('/(app)/driver/onboarding')}
          />
          <SoftButton title="Vehicles" onPress={() => router.push('/(app)/driver/vehicles' as Href)} />
          <SoftButton
            title="Sign out"
            onPress={async () => {
              await signOut();
              router.replace('/(auth)/splash');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const type = useTypography();
  const { spacing } = useResponsive();

  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.eyebrow, { fontSize: 10, color: colors.textMuted }]}>{label}</Text>
      <Text style={[type.h3, { marginTop: 4 }]}>{value}</Text>
    </View>
  );
}

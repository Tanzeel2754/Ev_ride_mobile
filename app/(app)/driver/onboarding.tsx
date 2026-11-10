import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
  getDriverOnboardingStatus,
  registerDriver,
  uploadIdDocument,
  uploadLicenseDocument,
} from '../../../src/api/driver';
import { createVehicle, listVehicles, uploadVehicleRegistration } from '../../../src/api/vehicle';
import type { GetDriverOnboardingStatusResponse } from '../../../src/types/api';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { DEFAULT_VEHICLE_TYPE_ID } from '../../../src/lib/config';
import { pickDocument } from '../../../src/lib/pick-document';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

type BusyAction = 'register' | 'license' | 'id' | 'vehicle' | 'registration' | null;

export default function DriverOnboardingScreen() {
  const router = useRouter();
  const { spacing } = useResponsive();
  const type = useTypography();
  const [status, setStatus] = useState<GetDriverOnboardingStatusResponse | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [error, setError] = useState<string | null>(null);

  const [license, setLicense] = useState('');
  const [expiry, setExpiry] = useState('2028-12-31');
  const [city, setCity] = useState('Johannesburg');
  const [make, setMake] = useState('BYD');
  const [model, setModel] = useState('Atto 3');
  const [year, setYear] = useState('2024');
  const [plate, setPlate] = useState('GP12EV');
  const [color, setColor] = useState('White');

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: { paddingBottom: spacing.xl },
        section: { marginBottom: spacing.lg },
        submitWrap: { marginTop: spacing.md },
      }),
    [spacing],
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const next = await getDriverOnboardingStatus();
      setStatus(next);
      if (next.hasVehicle) {
        const list = await listVehicles();
        setVehicleId(list.items?.[0]?.id ?? null);
      } else {
        setVehicleId(null);
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load onboarding status'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRegisterDriver() {
    setBusy('register');
    setError(null);
    try {
      if (!license.trim()) throw new Error('License number is required');
      const result = await registerDriver({
        drivingLicenseNumber: license.trim(),
        licenseExpiryOn: expiry,
        city: city.trim(),
        country: 'South Africa',
      });
      if (!result.isSuccess) throw new Error(result.message || 'Registration failed');
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Driver registration failed'));
    } finally {
      setBusy(null);
    }
  }

  async function onCreateVehicle() {
    setBusy('vehicle');
    setError(null);
    try {
      const y = Number(year);
      if (!make.trim() || !model.trim() || !plate.trim() || !Number.isFinite(y)) {
        throw new Error('Vehicle make, model, year and plate are required');
      }
      const result = await createVehicle({
        make: make.trim(),
        model: model.trim(),
        year: y,
        color: color.trim(),
        plateNumber: plate.trim(),
        vehicleTypeId: DEFAULT_VEHICLE_TYPE_ID,
      });
      if (!result.isSuccess) throw new Error(result.message || 'Vehicle create failed');
      if (result.data) setVehicleId(result.data);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not create vehicle'));
    } finally {
      setBusy(null);
    }
  }

  async function onUpload(kind: 'license' | 'id' | 'registration') {
    setError(null);
    try {
      const file = await pickDocument();
      if (!file) return;

      if (kind === 'registration' && !vehicleId) {
        throw new Error('Create a vehicle first, then upload its registration document.');
      }

      setBusy(kind);
      const result =
        kind === 'license'
          ? await uploadLicenseDocument(file.uri, file.name, file.mimeType)
          : kind === 'id'
            ? await uploadIdDocument(file.uri, file.name, file.mimeType)
            : await uploadVehicleRegistration(vehicleId!, file.uri, file.name, file.mimeType);

      if (!result.isSuccess) throw new Error(result.message || 'Upload failed');
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Document upload failed'));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading onboarding…" />
      </Screen>
    );
  }

  const registered = !!status?.isDriverRegistered;
  const showLicenseUpload = registered && !status?.hasDrivingLicence;
  const showIdUpload = registered && !status?.hasIdDocument;
  const showVehicleForm = registered && !status?.hasVehicle;
  const showRegistrationUpload = !!status?.hasVehicle && !status?.hasVehicleRegistrationDocument;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Label>Onboarding</Label>
          <Title>Driver setup</Title>
          <ErrorBanner message={error} />

          <Card>
            <StatusRow label="Registered" ok={registered} />
            <StatusRow label="License doc" ok={!!status?.hasDrivingLicence} />
            <StatusRow label="ID doc" ok={!!status?.hasIdDocument} />
            <StatusRow label="Vehicle" ok={!!status?.hasVehicle} />
            <StatusRow
              label="Vehicle registration doc"
              ok={!!status?.hasVehicleRegistrationDocument}
            />
            <StatusRow label="Complete" ok={!!status?.isComplete} />
          </Card>

          <Text style={[type.caption, { lineHeight: 18, marginBottom: spacing.md }]}>
            Upload a photo or PDF of your license, ID, and vehicle registration. JPEG, PNG, and PDF
            are accepted.
          </Text>

          {!registered ? (
            <View style={styles.section}>
              <Text style={[type.h3, { marginBottom: 4 }]}>1. Register driver</Text>
              <Field
                placeholder="Driving license number"
                value={license}
                onChangeText={setLicense}
              />
              <Field
                placeholder="License expiry (YYYY-MM-DD)"
                value={expiry}
                onChangeText={setExpiry}
              />
              <Field placeholder="City" value={city} onChangeText={setCity} />
              <View style={styles.submitWrap}>
                <PrimaryButton
                  title="Register as driver"
                  onPress={onRegisterDriver}
                  loading={busy === 'register'}
                  disabled={busy != null && busy !== 'register'}
                />
              </View>
            </View>
          ) : null}

          {showLicenseUpload ? (
            <View style={styles.section}>
              <Text style={[type.h3, { marginBottom: 4 }]}>2. Driving license document</Text>
              <Text style={[type.caption, { marginBottom: spacing.sm }]}>
                Upload a photo or PDF of your driving licence.
              </Text>
              <PrimaryButton
                title="Upload license document"
                onPress={() => onUpload('license')}
                loading={busy === 'license'}
                disabled={busy != null && busy !== 'license'}
              />
            </View>
          ) : null}

          {showIdUpload ? (
            <View style={styles.section}>
              <Text style={[type.h3, { marginBottom: 4 }]}>3. ID document</Text>
              <Text style={[type.caption, { marginBottom: spacing.sm }]}>
                Upload a photo or PDF of your national ID or passport.
              </Text>
              <PrimaryButton
                title="Upload ID document"
                onPress={() => onUpload('id')}
                loading={busy === 'id'}
                disabled={busy != null && busy !== 'id'}
              />
            </View>
          ) : null}

          {showVehicleForm ? (
            <View style={styles.section}>
              <Text style={[type.h3, { marginBottom: 4 }]}>4. Add vehicle</Text>
              <Field placeholder="Make" value={make} onChangeText={setMake} />
              <Field placeholder="Model" value={model} onChangeText={setModel} />
              <Field placeholder="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
              <Field placeholder="Color" value={color} onChangeText={setColor} />
              <Field placeholder="Plate number" value={plate} onChangeText={setPlate} />
              <View style={styles.submitWrap}>
                <PrimaryButton
                  title="Create vehicle"
                  onPress={onCreateVehicle}
                  loading={busy === 'vehicle'}
                  disabled={busy != null && busy !== 'vehicle'}
                />
              </View>
            </View>
          ) : null}

          {showRegistrationUpload ? (
            <View style={styles.section}>
              <Text style={[type.h3, { marginBottom: 4 }]}>5. Vehicle registration document</Text>
              <Text style={[type.caption, { marginBottom: spacing.sm }]}>
                Upload the registration papers for your EV.
              </Text>
              <PrimaryButton
                title="Upload registration document"
                onPress={() => onUpload('registration')}
                loading={busy === 'registration'}
                disabled={busy != null && busy !== 'registration'}
              />
            </View>
          ) : null}

          {status?.isComplete ? (
            <View style={{ gap: spacing.sm }}>
              <PrimaryButton
                title="Go to driver home"
                onPress={() => router.replace('/(app)/driver')}
              />
              <SoftButton
                title="Manage vehicles"
                onPress={() => router.push('/(app)/driver/vehicles' as Href)}
              />
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              <SoftButton title="Refresh status" onPress={load} />
              {status?.hasVehicle ? (
                <SoftButton
                  title="View vehicles"
                  onPress={() => router.push('/(app)/driver/vehicles' as Href)}
                />
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  const type = useTypography();
  const { spacing } = useResponsive();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
      }}
    >
      <Text style={[type.body, { color: colors.text }]}>{label}</Text>
      <Text style={{ color: ok ? colors.green : colors.warning, fontWeight: '700' }}>
        {ok ? 'Done' : 'Pending'}
      </Text>
    </View>
  );
}

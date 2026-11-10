import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
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
import { getVehicleById, updateVehicle, uploadVehicleRegistration } from '../../../src/api/vehicle';
import type { GetDriverVehicleByIdResponse } from '../../../src/types/api';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { pickDocument } from '../../../src/lib/pick-document';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';
import { VehicleType, VehicleTypeLabel, VerificationStatusLabel } from '../../../src/types/enums';

export default function DriverVehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { spacing } = useResponsive();
  const type = useTypography();
  const [vehicle, setVehicle] = useState<GetDriverVehicleByIdResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState(String(VehicleType.Standard));

  const load = useCallback(async () => {
    if (!id) {
      setError('Missing vehicle id.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const next = await getVehicleById(id);
      setVehicle(next);
      setMake(next.make ?? '');
      setModel(next.model ?? '');
      setYear(next.year ? String(next.year) : '');
      setColor(next.color ?? '');
      setPlate(next.plateNumber ?? '');
      setVehicleTypeId(String(next.vehicleTypeId ?? VehicleType.Standard));
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load vehicle'));
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onSave() {
    if (!id) return;
    const parsedYear = Number(year);
    if (!Number.isFinite(parsedYear) || parsedYear < 1980) {
      setError('Enter a valid year.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await updateVehicle({
        id,
        make: make.trim() || null,
        model: model.trim() || null,
        year: parsedYear,
        color: color.trim() || null,
        plateNumber: plate.trim() || null,
        vehicleTypeId: Number(vehicleTypeId) || VehicleType.Standard,
      });
      if (!result.isSuccess) throw new Error(result.message || 'Could not update vehicle');
      setEditing(false);
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update vehicle'));
    } finally {
      setSaving(false);
    }
  }

  async function onUploadRegistration() {
    if (!id) return;
    setError(null);
    try {
      const file = await pickDocument();
      if (!file) return;
      setUploading(true);
      const result = await uploadVehicleRegistration(id, file.uri, file.name, file.mimeType);
      if (!result.isSuccess) throw new Error(result.message || 'Upload failed');
      await load();
    } catch (e) {
      setError(getErrorMessage(e, 'Could not upload registration document'));
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <LoadingBlock label="Loading vehicle…" />
      </Screen>
    );
  }

  if (!vehicle) {
    return (
      <Screen>
        <Title>Vehicle not found</Title>
        <ErrorBanner message={error} />
        <View style={{ marginTop: spacing.md }}>
          <SoftButton title="Back to vehicles" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const typeLabel =
    vehicle.vehicleTypeId != null
      ? VehicleTypeLabel[vehicle.vehicleTypeId as VehicleType] ?? String(vehicle.vehicleTypeId)
      : '—';

  return (
    <Screen>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Label>Vehicle</Label>
      <Title>
        {vehicle.make || 'EV'} {vehicle.model || ''}
      </Title>
      <ErrorBanner message={error} />
      <Card accent>
        <Row label="Plate" value={vehicle.plateNumber || '—'} />
        <Row label="Year" value={String(vehicle.year || '—')} />
        <Row label="Color" value={vehicle.color || '—'} />
        <Row label="Type" value={typeLabel} />
        <Row
          label="Verification"
          value={
            VerificationStatusLabel[vehicle.verificationStatusId] ??
            String(vehicle.verificationStatusId)
          }
        />
        <Row
          label="Registration doc"
          value={vehicle.registrationDocumentUrl ? 'Uploaded' : 'Not uploaded'}
        />
        {vehicle.rejectionReason ? (
          <Row label="Rejection" value={vehicle.rejectionReason} />
        ) : null}
      </Card>
      {editing ? (
        <Card>
          <Field placeholder="Make" value={make} onChangeText={setMake} />
          <Field placeholder="Model" value={model} onChangeText={setModel} />
          <Field placeholder="Year" value={year} onChangeText={setYear} keyboardType="number-pad" />
          <Field placeholder="Color" value={color} onChangeText={setColor} />
          <Field placeholder="Plate" value={plate} onChangeText={setPlate} autoCapitalize="characters" />
          <Field
            placeholder="Type (1 Standard, 2 Moto, 3 Premium)"
            value={vehicleTypeId}
            onChangeText={setVehicleTypeId}
            keyboardType="number-pad"
          />
          <View style={{ marginTop: spacing.md }}>
            <PrimaryButton title="Save vehicle" onPress={onSave} loading={saving} />
          </View>
        </Card>
      ) : null}
      <View style={{ gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.xl }}>
        <SoftButton title={editing ? 'Close editor' : 'Edit vehicle'} onPress={() => setEditing((v) => !v)} />
        <PrimaryButton
          title={
            vehicle.registrationDocumentUrl
              ? 'Replace registration document'
              : 'Upload registration document'
          }
          onPress={onUploadRegistration}
          loading={uploading}
        />
        {vehicle.registrationDocumentUrl ? (
          <SoftButton
            title="Open registration document"
            onPress={() => Linking.openURL(vehicle.registrationDocumentUrl!)}
          />
        ) : null}
        <SoftButton title="Back to vehicles" onPress={() => router.back()} />
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

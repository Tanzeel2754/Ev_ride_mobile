import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  BottomSheet,
  ErrorBanner,
  Field,
  Label,
  PrimaryButton,
  SoftButton,
} from '../../../src/components/ui';
import { RideMap } from '../../../src/components/RideMap';
import { getErrorMessage } from '../../../src/api/client';
import { createRide } from '../../../src/api/rides';
import {
  requestAndGetCurrentPosition,
  useCurrentLocation,
} from '../../../src/hooks/useCurrentLocation';
import { useResponsive } from '../../../src/hooks/useResponsive';
import { DEFAULT_TRIP_TYPE_ID } from '../../../src/lib/config';
import { haversineDistanceKm } from '../../../src/lib/geo';
import {
  resolvePlaceNear,
  searchPlacesNearby,
  type PlaceSuggestion,
} from '../../../src/lib/place-search';
import type { LatLng } from '../../../src/types/api';
import { colors } from '../../../src/theme/colors';
import { useTypography } from '../../../src/theme/typography';

/** API rejects rides when estimatedDistanceKm is 0 / missing. */
const MIN_RIDE_DISTANCE_KM = 0.05;

/** Fallback when GPS / geocode unavailable */
const FALLBACK_PICKUP: LatLng = { latitude: -26.2041, longitude: 28.0473 };
const FALLBACK_DEST: LatLng = { latitude: -26.1076, longitude: 28.0567 };

export default function BookRideScreen() {
  const router = useRouter();
  const { spacing, radius } = useResponsive();
  const type = useTypography();

  const {
    coords: liveCoords,
    address: liveAddress,
    refresh: refreshLocation,
  } = useCurrentLocation(true);

  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [fare, setFare] = useState('150');
  const [pickupCoords, setPickupCoords] = useState<LatLng | null>(null);
  const [destCoords, setDestCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);
  const [locatingPickup, setLocatingPickup] = useState(false);
  const [searchingDest, setSearchingDest] = useState(false);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locHint, setLocHint] = useState<string | null>(null);
  const selectedLabelRef = useRef<string | null>(null);

  const biasCoords = pickupCoords ?? liveCoords;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { flex: 1, backgroundColor: colors.mapMid },
        actions: { marginTop: spacing.md, gap: spacing.sm },
        pickupRow: { marginTop: spacing.sm },
        suggestions: {
          marginTop: spacing.xs,
          borderWidth: 1.5,
          borderColor: colors.border,
          borderRadius: radius.lg,
          backgroundColor: colors.surface,
          overflow: 'hidden',
        },
        suggestionRow: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        suggestionRowLast: {
          borderBottomWidth: 0,
        },
      }),
    [spacing, radius],
  );

  // Seed pickup from GPS when available
  useEffect(() => {
    if (!liveCoords) return;
    setPickupCoords((prev) => prev ?? liveCoords);
    if (liveAddress) {
      setPickupAddress((prev) => (prev.trim() ? prev : liveAddress));
    }
  }, [liveCoords, liveAddress]);

  // Nearby place suggestions as the user types destination
  useEffect(() => {
    const query = destinationAddress.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearchingDest(false);
      if (selectedLabelRef.current !== query) {
        setDestCoords(null);
      }
      return;
    }

    // User already picked this exact suggestion — don't re-search
    if (selectedLabelRef.current === destinationAddress) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearchingDest(true);
      try {
        const results = await searchPlacesNearby(query, biasCoords, 6);
        if (cancelled) return;
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setLocHint(
          results.length
            ? null
            : 'No nearby matches — try another spelling or a fuller place name.',
        );
        // Preview first nearby match on the map while typing
        if (results[0]) {
          setDestCoords({
            latitude: results[0].latitude,
            longitude: results[0].longitude,
          });
        } else {
          setDestCoords(null);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
          setLocHint('Could not load place suggestions. Check your connection.');
        }
      } finally {
        if (!cancelled) setSearchingDest(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [destinationAddress, biasCoords]);

  const onDestinationChange = useCallback((text: string) => {
    selectedLabelRef.current = null;
    setDestinationAddress(text);
  }, []);

  const onSelectSuggestion = useCallback((place: PlaceSuggestion) => {
    const fullLabel = place.secondary
      ? `${place.label}, ${place.secondary}`
      : place.label;
    selectedLabelRef.current = fullLabel;
    setDestinationAddress(fullLabel);
    setDestCoords({ latitude: place.latitude, longitude: place.longitude });
    setSuggestions([]);
    setShowSuggestions(false);
    setLocHint(null);
  }, []);

  const useCurrentAsPickup = useCallback(async () => {
    setLocatingPickup(true);
    setError(null);
    setLocHint(null);
    try {
      const result = await requestAndGetCurrentPosition();
      setPickupCoords(result.coords);
      setPickupAddress(result.address || 'Current location');
      await refreshLocation();
    } catch (e) {
      const denied = !!(e as { permissionDenied?: boolean })?.permissionDenied;
      setLocHint(
        denied
          ? 'Location permission denied — enable it in settings to use current location.'
          : 'Could not read GPS for pickup.',
      );
    } finally {
      setLocatingPickup(false);
    }
  }, [refreshLocation]);

  async function onSubmit() {
    setError(null);
    setShowSuggestions(false);
    const proposedFare = Number(fare);
    if (!pickupAddress.trim() || !destinationAddress.trim()) {
      setError('Pickup and destination are required.');
      return;
    }
    if (!Number.isFinite(proposedFare) || proposedFare < 1) {
      setError('Enter a valid proposed fare.');
      return;
    }

    setLoading(true);
    try {
      let pickup = pickupCoords;
      let dest = destCoords;

      if (!pickup) {
        try {
          const current = await requestAndGetCurrentPosition();
          pickup = current.coords;
          setPickupCoords(current.coords);
          if (!pickupAddress.trim() && current.address) {
            setPickupAddress(current.address);
          }
        } catch {
          pickup = FALLBACK_PICKUP;
          setLocHint('Using fallback pickup coordinates.');
        }
      }

      if (!dest) {
        const resolved = await resolvePlaceNear(destinationAddress.trim(), pickup);
        if (resolved) {
          dest = { latitude: resolved.latitude, longitude: resolved.longitude };
          setDestCoords(dest);
        }
      }

      if (!dest) {
        dest = FALLBACK_DEST;
        setLocHint(
          'Destination could not be found nearby — using a demo destination. Pick a suggestion if you can.',
        );
      }

      const estimatedDistanceKm = Number(
        haversineDistanceKm(pickup, dest).toFixed(3),
      );
      if (estimatedDistanceKm < MIN_RIDE_DISTANCE_KM) {
        setError(
          'Pickup and destination are too close (or the same point). Pick a different destination from the suggestions.',
        );
        return;
      }

      const result = await createRide({
        pickupLatitude: pickup.latitude,
        pickupLongitude: pickup.longitude,
        pickupAddress: pickupAddress.trim() || 'Current location',
        destinationLatitude: dest.latitude,
        destinationLongitude: dest.longitude,
        destinationAddress: destinationAddress.trim(),
        tripTypeId: DEFAULT_TRIP_TYPE_ID,
        proposedFare,
        estimatedDistanceKm,
      });

      if (!result.isSuccess || !result.data) {
        throw new Error(result.message || 'Could not create ride');
      }

      router.replace({
        pathname: '/(app)/passenger/tracking',
        params: { rideId: result.data },
      });
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to create ride'));
    } finally {
      setLoading(false);
    }
  }

  const mapPickup = pickupCoords ?? liveCoords;
  const mapUser = liveCoords;

  return (
    <View style={styles.root}>
      <RideMap
        userLocation={mapUser}
        pickup={mapPickup}
        destination={destCoords}
        showUserLocation
        showRoute
        connected={!!mapUser}
        statusLabel={
          destCoords
            ? 'Route preview'
            : mapUser
              ? 'You are here — enter destination'
              : 'Finding your location…'
        }
      />
      <BottomSheet avoidKeyboard={false}>
          <Label>Plan ride</Label>
          <Text style={[type.h1, { marginTop: spacing.xs, fontSize: 24 }]}>Offer your fare</Text>
          <Text style={[type.body, { marginTop: spacing.xs, marginBottom: spacing.sm }]}>
            Pickup from where you are — nearby places appear as you type.
          </Text>
          <ErrorBanner message={error} />
          {locHint ? (
            <Text style={[type.caption, { color: colors.warning, marginBottom: spacing.sm }]}>
              {locHint}
            </Text>
          ) : null}
          {searchingDest ? (
            <Text style={[type.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>
              Searching nearby places…
            </Text>
          ) : null}

          <View style={styles.pickupRow}>
            <Field
              placeholder="Pickup address"
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
            <View style={{ marginTop: spacing.sm }}>
              <SoftButton
                title="Use current location"
                onPress={useCurrentAsPickup}
                loading={locatingPickup}
              />
            </View>
          </View>

          <Field
            placeholder="Destination (e.g. Kigali Airport)"
            value={destinationAddress}
            onChangeText={onDestinationChange}
            onFocus={() => {
              if (suggestions.length) setShowSuggestions(true);
            }}
            autoCorrect={false}
            returnKeyType="search"
          />
          {showSuggestions && suggestions.length > 0 ? (
            <View style={styles.suggestions}>
              {suggestions.map((place, index) => {
                const isLast = index === suggestions.length - 1;
                return (
                  <Pressable
                    key={place.id}
                    onPress={() => onSelectSuggestion(place)}
                    style={({ pressed }) => [
                      styles.suggestionRow,
                      isLast && styles.suggestionRowLast,
                      pressed && { backgroundColor: colors.greenMuted },
                    ]}
                  >
                    <Text style={type.h3}>{place.label}</Text>
                    {place.secondary ? (
                      <Text
                        style={[type.caption, { color: colors.textSecondary, marginTop: 2 }]}
                        numberOfLines={2}
                      >
                        {place.secondary}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          <Field
            placeholder="Proposed fare (RWF)"
            value={fare}
            onChangeText={setFare}
            keyboardType="decimal-pad"
          />

          <View style={styles.actions}>
            <PrimaryButton title="Book electric ride" onPress={onSubmit} loading={loading} />
            <SoftButton title="Cancel" onPress={() => router.back()} />
          </View>
      </BottomSheet>
    </View>
  );
}

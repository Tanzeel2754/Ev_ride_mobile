import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { LatLng } from '../types/api';
import { useResponsive } from '../hooks/useResponsive';
import { fetchDrivingRoute, routeKey } from '../lib/routing';
import { colors } from '../theme/colors';
import { useTypography } from '../theme/typography';

type Props = {
  pickup?: LatLng | null;
  destination?: LatLng | null;
  driver?: LatLng | null;
  /** Explicit “you are here” pin (also used where GPS blue-dot is unavailable). */
  userLocation?: LatLng | null;
  showUserLocation?: boolean;
  showRoute?: boolean;
  connected?: boolean;
  statusLabel?: string;
  showStatusChip?: boolean;
};

type MapPayload = {
  user?: LatLng | null;
  pickup?: LatLng | null;
  destination?: LatLng | null;
  driver?: LatLng | null;
  route: LatLng[];
};

export function regionFor(points: LatLng[]) {
  if (points.length === 0) {
    return {
      latitude: -26.2041,
      longitude: 28.0473,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }
  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;
  const latitudeDelta = Math.max((maxLat - minLat) * 1.6, 0.02);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.6, 0.02);
  return { latitude, longitude, latitudeDelta, longitudeDelta };
}

/** Leaflet + OSM — works in Expo Go and APKs (no Google Maps key). */
const OSM_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #EAF8EF; }
    .leaflet-container { font: 12px/1.4 system-ui, sans-serif; }
    .ev-pin {
      width: 28px; height: 28px; border-radius: 14px;
      background: #17A84B; border: 2px solid #fff;
      color: #fff; font-weight: 700; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: true })
      .setView([-26.2041, 28.0473], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
    }).addTo(map);
    var layers = L.layerGroup().addTo(map);
    var ready = false;

    function marker(latlng, color, label, isDriver) {
      if (!latlng || typeof latlng.latitude !== 'number') return null;
      var lat = latlng.latitude, lng = latlng.longitude;
      if (isDriver) {
        var icon = L.divIcon({
          className: '',
          html: '<div class="ev-pin">EV</div>',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        return L.marker([lat, lng], { icon: icon }).bindPopup(label || 'Driver');
      }
      return L.circleMarker([lat, lng], {
        radius: 9,
        color: '#ffffff',
        weight: 2,
        fillColor: color,
        fillOpacity: 1
      }).bindPopup(label || '');
    }

    window.__evUpdateMap = function (payload) {
      if (!payload) return;
      layers.clearLayers();
      var pts = [];
      function push(m) {
        if (!m) return;
        m.addTo(layers);
        var ll = m.getLatLng();
        pts.push(ll);
      }
      push(marker(payload.user, '#1E9EB0', 'You'));
      push(marker(payload.pickup, '#17A84B', 'Pickup'));
      push(marker(payload.destination, '#087B3A', 'Destination'));
      push(marker(payload.driver, '#17A84B', 'Driver', true));
      var bounds = null;
      if (payload.route && payload.route.length >= 2) {
        var line = payload.route.map(function (p) { return [p.latitude, p.longitude]; });
        var poly = L.polyline(line, { color: '#17A84B', weight: 4, opacity: 0.9 }).addTo(layers);
        bounds = poly.getBounds();
      }
      pts.forEach(function (ll) {
        if (!bounds) bounds = L.latLngBounds(ll, ll);
        else bounds.extend(ll);
      });
      if (bounds && bounds.isValid()) {
        if (pts.length <= 1 && !(payload.route && payload.route.length >= 2)) {
          map.setView(pts[0] || bounds.getCenter(), 15);
        } else {
          map.fitBounds(bounds, { padding: [48, 48], maxZoom: 16 });
        }
      }
      setTimeout(function () { map.invalidateSize(); }, 80);
    };

    document.addEventListener('message', function (e) {
      try { window.__evUpdateMap(JSON.parse(e.data)); } catch (err) {}
    });
    window.addEventListener('message', function (e) {
      try {
        var data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        window.__evUpdateMap(data);
      } catch (err) {}
    });

    ready = true;
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ready' }));
    }
  </script>
</body>
</html>`;

function OsmMap({
  payload,
}: {
  payload: MapPayload;
}) {
  const webRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const readyRef = useRef(false);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;

  const pushUpdate = (target?: 'native' | 'web') => {
    const json = JSON.stringify(payloadRef.current);
    if (target === 'web' || Platform.OS === 'web') {
      const win = iframeRef.current?.contentWindow;
      if (win) win.postMessage(json, '*');
      return;
    }
    webRef.current?.injectJavaScript(
      `try{window.__evUpdateMap(${json});}catch(e){};true;`,
    );
  };

  useEffect(() => {
    if (!readyRef.current) return;
    pushUpdate();
  }, [payload]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.map}>
        {createElement('iframe', {
          ref: (node: HTMLIFrameElement | null) => {
            iframeRef.current = node;
          },
          title: 'Ride map',
          srcDoc: OSM_HTML,
          style: { border: 0, width: '100%', height: '100%' },
          onLoad: () => {
            readyRef.current = true;
            // Slight delay so Leaflet finishes init inside srcDoc
            setTimeout(() => pushUpdate('web'), 120);
          },
        })}
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      style={styles.map}
      originWhitelist={['*']}
      source={{ html: OSM_HTML, baseUrl: 'https://unpkg.com' }}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
      setSupportMultipleWindows={false}
      onMessage={(event: WebViewMessageEvent) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg?.type === 'ready') {
            readyRef.current = true;
            pushUpdate('native');
          }
        } catch {
          // ignore
        }
      }}
      onLoadEnd={() => {
        // Fallback if ready message is missed
        setTimeout(() => {
          readyRef.current = true;
          pushUpdate('native');
        }, 200);
      }}
    />
  );
}

export function RideMap({
  pickup,
  destination,
  driver,
  userLocation,
  showRoute = true,
  connected,
  statusLabel,
  showStatusChip = true,
}: Props) {
  const type = useTypography();
  const { spacing, radius } = useResponsive();
  const [roadRoute, setRoadRoute] = useState<LatLng[]>([]);

  // Avoid double pin when pickup === current location
  const showYouMarker =
    !!userLocation &&
    (!pickup ||
      Math.abs(pickup.latitude - userLocation.latitude) > 0.00005 ||
      Math.abs(pickup.longitude - userLocation.longitude) > 0.00005);

  const straightFallback = useMemo(() => {
    if (!showRoute || !pickup || !destination) return [] as LatLng[];
    return [pickup, destination];
  }, [showRoute, pickup, destination]);

  const key = routeKey(pickup, destination);

  useEffect(() => {
    if (!showRoute || !pickup || !destination || !key) {
      setRoadRoute([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const points = await fetchDrivingRoute(pickup, destination);
        if (cancelled) return;
        setRoadRoute(points.length >= 2 ? points : [pickup, destination]);
      } catch {
        if (!cancelled) setRoadRoute([pickup, destination]);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [showRoute, key, pickup, destination]);

  const routeCoords =
    roadRoute.length >= 2 ? roadRoute : straightFallback;

  const payload = useMemo<MapPayload>(
    () => ({
      user: showYouMarker ? userLocation : null,
      pickup: pickup ?? null,
      destination: destination ?? null,
      driver: driver ?? null,
      route: routeCoords,
    }),
    [showYouMarker, userLocation, pickup, destination, driver, routeCoords],
  );

  return (
    <View style={styles.root}>
      <OsmMap payload={payload} />
      {showStatusChip ? (
        <StatusChip
          connected={connected}
          statusLabel={statusLabel}
          spacing={spacing}
          radius={radius}
          type={type}
        />
      ) : null}
    </View>
  );
}

function StatusChip({
  connected,
  statusLabel,
  spacing,
  radius,
  type,
}: {
  connected?: boolean;
  statusLabel?: string;
  spacing: { sm: number; md: number };
  radius: { md: number };
  type: ReturnType<typeof useTypography>;
}) {
  return (
    <View
      style={[
        styles.chip,
        {
          top: spacing.md,
          left: spacing.md,
          right: spacing.md,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
    >
      <Text style={[type.eyebrow, { fontSize: 10 }]}>
        {connected ? 'Live' : 'Updating'}
      </Text>
      <Text style={[type.h3, { marginTop: 2 }]} numberOfLines={1}>
        {statusLabel || 'Trip map'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.mapMid,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  chip: {
    position: 'absolute',
    backgroundColor: colors.surfaceGlass,
    borderWidth: 1.5,
    borderColor: colors.border,
    zIndex: 2,
    shadowColor: '#082844',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
});

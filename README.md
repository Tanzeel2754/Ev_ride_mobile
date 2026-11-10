# EV Ride (Expo)

React Native mobile app for **EV Ride** — passenger + driver — connected to the existing Azure ASP.NET Core API.

## Backend

Base URL (configurable):

```text
https://evrides-exaabxfrcdefc9dh.southeastasia-01.azurewebsites.net
```

Auth flow:

1. `POST /api/auth/register` — register with `name` + `email`
2. `POST /api/auth/verify-otp` — enter the OTP emailed to that address
3. Store JWT (`accessToken`) — valid ~15 days
4. Send `Authorization: Bearer <token>` on authenticated requests

## Setup

Requires **Expo Go SDK 57** (Play Store / App Store version).

```bash
cd evrides-mobile
npm install
npx expo start -c
```

Then press `a` for Android emulator / device, or scan the QR code with Expo Go.

> Clear Metro cache with `-c` after upgrading the SDK.

## Environment

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_BASE_URL` | Azure API base URL (no trailing slash) |

Do **not** put backend secrets, DB passwords, or JWT signing keys in the app.

## App structure

```text
app/
  (auth)/          splash, register, verify OTP
  (app)/
    mode.tsx       choose passenger or driver
    passenger/     home, book, tracking, history, profile
    driver/        home, available, active, onboarding, vehicles, vehicle, profile
src/
  api/             HTTP client + endpoint modules
  types/           Swagger-aligned models + enums
  context/         AuthProvider
  components/      UI primitives
  theme/           EV Ride colors
```

## Feature → API

| Feature | Method | Endpoint |
|---------|--------|----------|
| Register | POST | `/api/auth/register` |
| Verify OTP | POST | `/api/auth/verify-otp` |
| Create ride | POST | `/api/rides` |
| Current ride | GET | `/api/rides/current` |
| Ride by id | GET | `/api/rides/id?Id=` |
| History | GET | `/api/rides/history` |
| Cancel (passenger) | PUT | `/api/rides/cancel` |
| Rate ride | POST | `/api/ratings` |
| Online status | PUT | `/api/rides/online-status` |
| Location | PUT | `/api/rides/location` |
| Available rides | GET | `/api/rides/available` |
| Accept / arriving / arrived / start / complete | PUT | `/api/rides/*` |
| Driver register | POST | `/api/driver/register` |
| Onboarding status | GET | `/api/driver/onboarding-status` |
| Registration status | GET | `/api/driver/registration-status` |
| License / ID upload | POST | `/api/driver/license-document`, `/api/driver/id-document` |
| Create vehicle | POST | `/api/vehicle` |
| List / get vehicle | GET | `/api/vehicle`, `/api/vehicle/id` |
| Vehicle registration upload | POST | `/api/vehicle/registration` |

## Notes

- `tripTypeId` defaults to `1` (`DEFAULT_TRIP_TYPE_ID` in `src/lib/config.ts`) — confirm with backend.
- Mock “counter-offer / multi-driver bids” UI is **not** in the API; the app uses proposed fare + driver accept.
- Document uploads (license / ID / vehicle registration) use `expo-document-picker` on the driver onboarding and vehicle screens.
- Maps use **OpenStreetMap** (Leaflet in a WebView) so they work in Expo Go and APKs without a Google Maps API key.
- Road paths use public **OSRM** routing (pickup → destination along streets). Falls back to a straight line if routing is unavailable.
- Destination booking uses nearby place autocomplete (Photon / Nominatim), biased to the passenger GPS / pickup city.
- CORS does not apply to native apps the same way as browsers; use HTTPS Azure URL as configured.

## Scripts

```bash
npm start          # expo start
npm run android    # open Android
npm run ios        # open iOS (macOS)
```
"# Ev_ride_mobile" 

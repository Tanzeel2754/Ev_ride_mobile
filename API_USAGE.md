# EVRide Mobile — API Usage

This document lists every backend API endpoint wired in the mobile app, where each is called, and how it is used in the UI.

**Base URL (production):** `https://evrides-exaabxfrcdefc9dh.southeastasia-01.azurewebsites.net`

**Swagger:** `/swagger/v1/swagger.json`

---

## Summary

| Category | Defined in app | Used in UI | Not wired to UI |
|----------|----------------|------------|-----------------|
| Auth | 2 | 2 | 0 |
| Rides | 14 | 14 | 0 |
| Driver | 6 | 6 | 0 |
| Vehicle | 4 | 4 | 0 |
| Chat | 3 | 3 | 0 |
| SignalR | `/hubs/chat` + `/hubs/rides` | Tracking, driver active, available offers, trip chat | 0 |
| **Total** | **29 + hubs** | **29 + hubs** | **0** |

All HTTP calls go through `src/api/client.ts` (`apiRequest`). Authenticated requests send `Authorization: Bearer <JWT>` from SecureStore. Auth endpoints are called without a token. Realtime uses `@microsoft/signalr` against the real API origin (not the Metro CORS proxy): `{API}/hubs/chat` for messages and `{API}/hubs/rides` for ride lifecycle.

---

## Authentication

| # | Method | Endpoint | API module | Used in app | Screen / context | Purpose |
|---|--------|----------|------------|-------------|------------------|---------|
| 1 | `POST` | `/api/auth/register` | `auth.ts` → `signUp()` / `requestOtp()` | Yes | `app/(auth)/register.tsx`, `sign-in.tsx` | Register / request OTP with `name`, `email` **or** `phoneNumber`, and `loginMethod` (`"email"` \| `"sms"`). |
| 2 | `POST` | `/api/auth/verify-otp` | `auth.ts` → `verifyOtp()` | Yes | `app/(auth)/verify-otp.tsx` | Verify OTP with matching `loginMethod` + `email`/`phoneNumber`. Fixed OTP: `123456` (`SmsOtp:FixedCode`; email also fixed). Saves JWT + refresh token. |

**Notes:**
- Always send `loginMethod`: `"email"` or `"sms"`.
- Phone numbers must be digits only (no `+`).
- SMS OTP uses backend `SmsOtp:FixedCode` = `123456`; email OTP is also fixed to the same code for now.
- On `401`, `client.ts` clears the session and triggers `AuthContext` to sign the user out.

---

## Rides (Passenger + Driver)

| # | Method | Endpoint | API module | Used in app | Screen / context | Purpose |
|---|--------|----------|------------|-------------|------------------|---------|
| 3 | `POST` | `/api/rides` | `rides.ts` → `createRide()` | Yes | `app/(app)/passenger/book.tsx` | Create a ride with pickup/destination coords, addresses, `tripTypeId` (default `1`), and proposed fare. Uses GPS or Johannesburg demo coords. Redirects to tracking on success. |
| 4 | `GET` | `/api/rides/current` | `rides.ts` → `getCurrentRide()` | Yes | `app/(app)/passenger/index.tsx` (on focus) | Check if passenger has an active ride; show “Open live trip” or booking CTA. |
| 5 | `GET` | `/api/rides/current` | `rides.ts` → `getCurrentRide()` | Yes | `app/(app)/passenger/tracking.tsx` | Fallback when `getRideById` fails. Polled every 5 seconds. |
| 6 | `GET` | `/api/rides/current` | `rides.ts` → `getCurrentRide()` | Yes | `app/(app)/driver/active.tsx` | Fallback when ride ID lookup fails. Polled every 5 seconds. |
| 7 | `GET` | `/api/rides/id?Id={id}` | `rides.ts` → `getRideById()` | Yes | `app/(app)/passenger/tracking.tsx` | Load ride details by ID from route params. Primary source for live trip UI. |
| 8 | `GET` | `/api/rides/id?Id={id}` | `rides.ts` → `getRideById()` | Yes | `app/(app)/driver/active.tsx` | Load active ride by ID. Drives status-based action buttons. |
| 9 | `GET` | `/api/rides/history` | `rides.ts` → `getRideHistory()` | Yes | `app/(app)/passenger/history.tsx` (on focus + pull-to-refresh) | List past rides with status, route, date, and final fare. |
| 10 | `PUT` | `/api/rides/cancel` | `rides.ts` → `cancelRide()` | Yes | `app/(app)/passenger/tracking.tsx` | Passenger cancels ride while status is Searching / Accepted / DriverArriving / DriverArrived. |
| 11 | `GET` | `/api/rides/available` | `rides.ts` → `getAvailableRides()` | Yes | `app/(app)/driver/available.tsx` (on focus + SignalR offers + poll every 18s + pull-to-refresh) | List nearby ride requests for online drivers. |
| 12 | `PUT` | `/api/rides/accept` | `rides.ts` → `acceptRide()` | Yes | `app/(app)/driver/available.tsx` | Driver accepts a ride; navigates to active ride screen. |
| 13 | `PUT` | `/api/rides/arriving` | `rides.ts` → `markArriving()` | Yes | `app/(app)/driver/active.tsx` | Driver marks “on the way” when status is Accepted. |
| 14 | `PUT` | `/api/rides/arrived` | `rides.ts` → `markArrived()` | Yes | `app/(app)/driver/active.tsx` | Driver marks arrived at pickup when status is DriverArriving. |
| 15 | `PUT` | `/api/rides/start` | `rides.ts` → `startRide()` | Yes | `app/(app)/driver/active.tsx` | Start trip when status is DriverArrived. |
| 16 | `PUT` | `/api/rides/complete` | `rides.ts` → `completeRide()` | Yes | `app/(app)/driver/active.tsx` | Complete trip when InProgress (sends demo distance/duration/final fare). |
| 17 | `PUT` | `/api/rides/driver-cancel` | `rides.ts` → `driverCancelRide()` | Yes | `app/(app)/driver/active.tsx` | Driver cancels during Accepted → InProgress. |
| 18 | `PUT` | `/api/rides/online-status` | `rides.ts` → `updateOnlineStatus()` | Yes | `app/(app)/driver/index.tsx` | Toggle driver online/offline from dashboard. |
| 19 | `PUT` | `/api/rides/location` | `rides.ts` → `updateDriverLocation()` | Yes | `app/(app)/driver/index.tsx` | When going online, sends current GPS lat/lng to backend. |

---

## Driver profile & onboarding

| # | Method | Endpoint | API module | Used in app | Screen / context | Purpose |
|---|--------|----------|------------|-------------|------------------|---------|
| 20 | `POST` | `/api/driver/register` | `driver.ts` → `registerDriver()` | Yes | `app/(app)/driver/onboarding.tsx` | Register as driver (license number, expiry, city, country). |
| 21 | `GET` | `/api/driver/onboarding-status` | `driver.ts` → `getDriverOnboardingStatus()` | Yes | `app/(app)/driver/index.tsx`, `onboarding.tsx` | Check registration/doc/vehicle completion flags; gate “Go online” vs onboarding flow. |
| 22 | `GET` | `/api/driver/profile` | `driver.ts` → `getDriverProfile()` | Yes | `app/(app)/driver/index.tsx`, `driver/profile.tsx` | Load rating, trips, online status, verification, license for dashboard and profile. |
| 23 | `GET` | `/api/driver/registration-status` | `driver.ts` → `getDriverRegistrationStatus()` | Yes | `app/(app)/driver/profile.tsx` | Show license/ID document flags and registration verification on the profile Documents card. |
| 24 | `POST` | `/api/driver/license-document` | `driver.ts` → `uploadLicenseDocument()` | Yes | `app/(app)/driver/onboarding.tsx` | Multipart upload of driving licence photo/PDF via `expo-document-picker`. |
| 25 | `POST` | `/api/driver/id-document` | `driver.ts` → `uploadIdDocument()` | Yes | `app/(app)/driver/onboarding.tsx` | Multipart upload of national ID / passport photo/PDF. |

---

## Vehicle

| # | Method | Endpoint | API module | Used in app | Screen / context | Purpose |
|---|--------|----------|------------|-------------|------------------|---------|
| 26 | `POST` | `/api/vehicle` | `vehicle.ts` → `createVehicle()` | Yes | `app/(app)/driver/onboarding.tsx` | Create EV vehicle (make, model, year, color, plate, `vehicleTypeId` default `1`). |
| 27 | `GET` | `/api/vehicle?PageNumber=&PageSize=` | `vehicle.ts` → `listVehicles()` | Yes | `app/(app)/driver/vehicles.tsx`, `onboarding.tsx` | List the driver’s vehicles. Onboarding uses the first vehicle id for registration-doc upload. |
| 28 | `GET` | `/api/vehicle/id?Id={id}` | `vehicle.ts` → `getVehicleById()` | Yes | `app/(app)/driver/vehicle.tsx` | Load a single vehicle (plate, year, type, verification, registration doc). |
| 29 | `POST` | `/api/vehicle/registration?vehicleId=` | `vehicle.ts` → `uploadVehicleRegistration()` | Yes | `onboarding.tsx`, `vehicle.tsx` | Multipart upload of vehicle registration papers. |

File uploads use field name `file` (multipart/form-data). Accepted types in the picker: images and PDF. Upload timeout is 60 seconds.

---

## Chat (in-ride)

| # | Method | Endpoint | API module | Used in app | Screen / context | Purpose |
|---|--------|----------|------------|-------------|------------------|---------|
| 30 | `POST` | `/api/chats` | `chats.ts` → `sendChatMessage()` | Yes | `app/(app)/chat.tsx` via `RideChat` | Send a text (or voice metadata) message for a ride. `messageTypeId`: Text = 1, Voice = 2. |
| 31 | `GET` | `/api/chats/ride?RideId=` | `chats.ts` → `getRideMessages()` | Yes | `RideChat` | Load message history for a ride. |
| 32 | `PUT` | `/api/chats/read` | `chats.ts` → `markMessagesAsRead()` | Yes | `RideChat` (on open / incoming) | Mark messages in the ride thread as read. |

**UI gate:** Chat button appears only after the driver accepts (`rideStatusId` Accepted → InProgress). Searching passengers see a hint that chat unlocks on accept.

---

## SignalR realtime

| Hub | Client | Used in | Purpose |
|-----|--------|---------|---------|
| `/hubs/chat` | `src/realtime/chatHub.ts` + `useChatRealtime` | Trip chat | Live chat messages. JWT via `accessTokenFactory`. |
| `/hubs/rides` | `src/realtime/rideHub.ts` + `useRideRealtime` / `useDriverRideOffers` | Passenger tracking, driver active, driver available | Ride lifecycle + driver location. |

### Rides hub methods (frontend invokes)

| Method | Where |
|--------|--------|
| `JoinRide(rideId)` | Passenger tracking after create/accept; driver active after accept. Also after SignalR reconnect when `GET /api/rides/current` returns an active ride. |
| `LeaveRide(rideId)` | When leaving the active-ride screen (completed / cancelled / unmount). |

### Rides hub events (frontend receives)

| Event | Used by | Behavior |
|-------|---------|----------|
| `NewRideAvailable` | Driver | Available rides screen — refresh list |
| `RideUnavailable` | Driver | Remove offer from list |
| `RideAccepted` | Passenger | Searching/tracking — refresh ride |
| `RideStatusChanged` | Passenger + driver | Update arriving / arrived / in-progress / completed / no-driver |
| `DriverLocationUpdated` | Passenger | Move driver marker (lat/lng) |
| `RideCancelled` | Passenger or driver | Show cancelled and refresh |

Driver location is published with `PUT /api/rides/location`; passengers receive it via `DriverLocationUpdated` (not by invoking location over the hub).

---

## Screen → API map

| Screen | APIs called |
|--------|-------------|
| `(auth)/register` | `POST /api/auth` |
| `(auth)/verify-otp` | `POST /api/auth/verify-otp` |
| `(app)/mode` | None (local session only) |
| `(app)/passenger/index` | `GET /api/rides/current` |
| `(app)/passenger/book` | `POST /api/rides` |
| `(app)/passenger/tracking` | `GET /api/rides/id`, `GET /api/rides/current`, `PUT /api/rides/cancel`, SignalR `/hubs/rides` |
| `(app)/passenger/history` | `GET /api/rides/history` |
| `(app)/passenger/profile` | None (reads session from SecureStore) |
| `(app)/driver/index` | `GET /api/driver/onboarding-status`, `GET /api/driver/profile`, `PUT /api/rides/online-status`, `PUT /api/rides/location` |
| `(app)/driver/onboarding` | `GET /api/driver/onboarding-status`, `POST /api/driver/register`, `POST /api/driver/license-document`, `POST /api/driver/id-document`, `POST /api/vehicle`, `GET /api/vehicle`, `POST /api/vehicle/registration` |
| `(app)/driver/vehicles` | `GET /api/vehicle` |
| `(app)/driver/vehicle` | `GET /api/vehicle/id`, `POST /api/vehicle/registration` |
| `(app)/driver/available` | `GET /api/rides/available`, `PUT /api/rides/accept`, SignalR `/hubs/rides` |
| `(app)/driver/active` | `GET /api/rides/id`, `GET /api/rides/current`, ride status PUTs, `PUT /api/rides/location` (live), SignalR `/hubs/rides` |
| `(app)/driver/profile` | `GET /api/driver/profile`, `GET /api/driver/registration-status` |
| `(app)/chat` | `GET/POST /api/chats*`, SignalR `/hubs/chat` |

---

## API client behavior

**File:** `src/api/client.ts`

- **Base URL:** Resolved in `src/lib/config.ts`
  - Production / release: `EXPO_PUBLIC_API_BASE_URL` or `app.json` → `extra.apiBaseUrl` or Azure URL
  - Dev (Expo Go): Metro proxy `http://<pc-ip>:8081/__api` to avoid browser CORS issues
- **Auth header:** `Bearer` token from `expo-secure-store` (set after OTP verify)
- **Timeout:** 30 seconds (60 seconds for document uploads)
- **Errors:** Normalized to `{ status, message }` via `getErrorMessage()`

---

## Source file index

| File | Endpoints |
|------|-----------|
| `src/api/auth.ts` | 2 |
| `src/api/rides.ts` | 14 |
| `src/api/driver.ts` | 6 |
| `src/api/vehicle.ts` | 4 |
| `src/api/chats.ts` | 3 |
| `src/realtime/chatHub.ts` | SignalR `/hubs/chat` |
| `src/realtime/rideHub.ts` | SignalR `/hubs/rides` |
| `src/hooks/useChatRealtime.ts` | Chat hub hook |
| `src/hooks/useRideRealtime.ts` | Rides hub (JoinRide) |
| `src/hooks/useDriverRideOffers.ts` | Rides hub (offers) |

---

## Polling & refresh

| Screen | Behavior |
|--------|----------|
| Passenger home | Refetch on screen focus |
| Passenger tracking | SignalR primary + poll every **12s** |
| Passenger history | Refetch on focus + pull-to-refresh |
| Driver available rides | SignalR offers + poll every **18s** + pull-to-refresh |
| Driver active ride | SignalR `/hubs/rides` + live GPS publish + poll every **12s** |
| Trip chat | REST history + SignalR `/hubs/chat` incoming messages |
| Driver home / onboarding / profile / vehicles / vehicle | Refetch on screen focus |
| Driver vehicles | Pull-to-refresh |

---

*Last updated from codebase: EVRide mobile — dual SignalR hubs (`/hubs/chat`, `/hubs/rides`)*

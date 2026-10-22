# The Off Grid Mobile — Release Setup

## 1. Install

```bash
npm install
```

If npm reports peer/dependency conflicts, do not use `--force` blindly; resolve the reported package versions first.

## 2. Configure

Copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_API_URL=https://YOUR-API-DOMAIN/api
EXPO_PUBLIC_EAS_PROJECT_ID=YOUR-EAS-PROJECT-ID
```

The API URL must be the production API base that exposes the routes documented in `V9_INTEGRATION.md`.

## 3. Validate

```bash
npm run typecheck
npm run doctor
```

## 4. Run on Android

```bash
npx expo start
```

Then open the project with Expo Go if the native dependencies are supported, or use a development build for Razorpay/native functionality.

## 5. Build an Android preview

```bash
eas login
eas build --platform android --profile preview
```

The preview profile is configured to produce an APK for device testing.

## 6. Production build

After checkout, notifications, authentication, and backend integration have been tested on a real device:

```bash
eas build --platform android --profile production
```

## Important

Razorpay and push notifications require native/dev-build validation. Do not treat a successful JavaScript bundle as proof that payments or notifications work on a physical device.


## Release safety check
`npm run release:check` now rejects placeholder API, EAS project, and Razorpay values. Replace all placeholder values before a release build.

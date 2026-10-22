# The Off Grid Mobile V29

Clean Expo SDK 57 / React Native 0.86 mobile app for The Off Grid fashion store.

## Stack
- Expo SDK 57
- React 19.2.3
- React Native 0.86.3
- Expo Router 57
- TypeScript 6

## Install
```bash
npm install
npx expo start
```

For Expo Go, use an SDK 57 Expo Go build. Razorpay online payments require a development/production native build; COD works in Expo Go.

The production API is built into the app as `https://the-off-grid-api.onrender.com/api`. You do **not** need to create or edit `.env` for normal product/catalog updates. The website Admin and mobile app use the same backend/database, so product changes made in the website appear in the mobile app after it refreshes. Optional `.env` overrides are for development only. Never put the Razorpay secret in the mobile app.

## Checks
```bash
npm run typecheck
npm run doctor
npm run release:check
```

## Android
```bash
npm run build:preview
```


## V3 production feature expansion
- Server-backed OFF GRID CLUB wallet and activity
- Referral code + referral tracking
- Restock alert subscription
- Product recommendations from the shared API
- Return or exchange request flow
- Pincode delivery estimate/COD check
- In-app support request
- Product deep-link intent for Android
- Registration referral-code support
- Product delivery checker and restock CTA

Backend companion: `the-off-grid-backend-v3-production.zip`. The mobile app remains connected to the same Render API base URL.

Important: run `npm install`, `npm run typecheck`, `npx expo-doctor`, then `npx expo start -c` on Windows. A production/development build is required for native Razorpay and remote notifications.

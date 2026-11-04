# The Off Grid — Mobile App

Expo (SDK 57) / React Native 0.86 app for The Off Grid fashion store. It shares one backend with the website:

| Repo | What it is |
|---|---|
| `the-off-grid-mobile` (this repo) | Customer mobile app |
| `The-Off-Grid` | Website and admin panel (Vercel) |
| `the-off-grid-backend` | Shared API (Render + Neon Postgres) |

API: `https://the-off-grid-api.onrender.com/api` (built into the app; no `.env` needed for normal use).

## Stack
Expo SDK 57 · React 19.2 · React Native 0.86 · Expo Router 57 · TypeScript

## Design
Dark-only, matching the website: paper `#0A0A0A`, ink `#F2F0EA`, accent `#FF3B30`. Space Grotesk (headings, wordmark) and DM Sans (body), bundled in `assets/fonts` (SIL OFL licences alongside). Tokens live in `src/theme/ThemeProvider.tsx` and `src/theme.ts`.

## Features
- **Shopping:** catalogue, search (text, voice, photo), filters and sorting, product pages with gallery/zoom, size guide and Find My Size, colour/size variants, fabric and model details, reviews with customer photos, recently viewed, recommendations, product comparison (up to 3), offline catalogue cache
- **Checkout:** cart, saved addresses, coupons, gift cards, OFF GRID CLUB points, premium gift packaging, Razorpay online payments and COD, pincode delivery estimate
- **Orders:** timeline, courier/AWB, cancellation, returns and exchanges, invoices, Buy again
- **OFF GRID CLUB:** tiers, points wallet and history, referrals, birthday reward, member early access to drops
- **Discovery and community:** New Drops with countdown, Shop the Look, Complete the Look, Looks, Community outfits, AI Stylist, Style Quiz, Gift Ideas, Creator programme
- **Account:** email login, phone OTP, delete account, notifications, support, settings

## Run
```bash
npm install
npx expo start
```
Expo Go works for browsing and COD. Razorpay, push notifications, voice search, the image picker and the bundled fonts need a **development or production native build**.

## Checks
```bash
npm run typecheck
npm run doctor
npm run release:check
```
CI ("Mobile quality gate") runs the type check on every pull request to `main`.

## Build (Android)
```bash
npm run build:preview      # internal test build
npm run build:production   # store build
```
See `BUILD_RELEASE.md`, `RELEASE_SETUP.md`, `RELEASE_VALIDATION.md` and `LAUNCH_CHECKLIST.md`. Older integration notes are in `docs/archive/`.

## Not built yet
Google sign-in (needs Google client IDs), live courier tracking via an aggregator such as Shiprocket, a Style Journal, virtual try-on.

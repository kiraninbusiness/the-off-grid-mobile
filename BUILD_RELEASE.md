# The Off Grid Mobile — Release Build

## 1. Install

```bash
npm install
```

## 2. Configure

Copy `.env.example` to `.env` and set:

- `EXPO_PUBLIC_API_URL=https://YOUR-API-DOMAIN/api`
- `EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID`
- `EXPO_PUBLIC_RAZORPAY_KEY_ID=YOUR_RAZORPAY_KEY_ID`

Do not put Razorpay secret keys in the app.

## 3. Validate TypeScript

```bash
npx tsc --noEmit
```

## 4. Android preview APK

```bash
npx eas build --platform android --profile preview
```

Install the APK on a physical Android phone and test:

- onboarding
- product → size → bag
- guest cart persistence
- registration/login
- cart merge after login
- address selection
- coupon validation
- COD order
- Razorpay payment
- payment cancellation/retry
- order history/details/cancellation
- push notification tap routing

## 5. Production Android AAB

```bash
npx eas build --platform android --profile production
```

## 6. Backend safety

The server must remain authoritative for:

- product price
- inventory/stock
- size/color availability
- coupon validity and discount
- shipping charge
- final order total
- Razorpay order creation
- Razorpay signature verification

The mobile app must never be trusted for these values.


## V12 validation notes
- Online payment cancellation now attempts to mark the server-side payment as cancelled.
- Missing Razorpay configuration now attempts payment cleanup before failing.
- Checkout validates a 10-digit Indian mobile number and 6-digit PIN code.
- Saved-address loading is skipped for guest users.

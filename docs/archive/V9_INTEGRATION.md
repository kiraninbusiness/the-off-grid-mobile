# The Off Grid Mobile V9 — integration checklist

V9 focuses on the real shopping journey while retaining the V9 visual direction.

## Required environment

Set these before a production build:

- `EXPO_PUBLIC_API_URL` — the deployed customer API base URL, including `/api` if the server uses that prefix.
- `EXPO_PUBLIC_EAS_PROJECT_ID` — Expo/EAS project ID for push notifications.
- `EXPO_PUBLIC_RAZORPAY_KEY_ID` — Razorpay public key for the mobile checkout.

## Customer journey to test on a real device

1. Open app → onboarding → Home.
2. Browse Shop → open product → choose size → Add to Bag.
3. Close/reopen app and confirm the guest cart persists.
4. Create account or sign in.
5. Confirm server cart/wishlist load after authentication.
6. Add/edit delivery address and select it during checkout.
7. Apply a valid and invalid coupon.
8. Test COD order creation and order history.
9. In a development/production build (not Expo Go), test Razorpay payment, signature verification and payment-cancel recovery.
10. Open an order from a push notification and from the Account page.

## Backend contract expected by the app

- `GET /products`
- `GET /products/:id`
- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/me`
- `GET /cart`, `PUT /cart/item`, `DELETE /cart/item/:id`
- `GET/PUT/DELETE /cart/wishlist...`
- `GET /profile/addresses`
- `GET /orders/mine`, `GET /orders/:id`, `POST /orders/create`
- `PATCH /orders/:id`, `PATCH /orders/:id/payment-cancel`
- `POST /coupons/validate`
- `POST /orders/verify-payment`
- `POST /notifications/push-token`

The server must validate price, stock, variant availability, coupon rules and payment signatures itself; the mobile app must not be treated as a trusted source for those values.

## Release note

The source archive has not been device-built in this environment because dependencies are not installed here. Before publishing, run `npm install`, then the Expo/EAS preview build and real-device checkout tests above.

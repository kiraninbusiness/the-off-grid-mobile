# The Off Grid — V9 Launch Checklist

## Brand & store listing
- [ ] Replace the temporary adaptive icon with the final The Off Grid logo artwork.
- [ ] Add final 1024px iOS/Android icon assets and splash artwork.
- [ ] Confirm app name: The Off Grid.
- [ ] Confirm package/bundle ID: `in.theoffgrid.app`.
- [ ] Prepare screenshots for phone sizes used by Google Play and App Store Connect.
- [ ] Write the final short and full store descriptions.

## Legal & support
- [ ] Publish Privacy Policy URL.
- [ ] Publish Terms & Conditions URL.
- [ ] Publish Shipping/Returns policy URL.
- [ ] Add customer-support email and WhatsApp/contact URL.
- [ ] Complete Google Play Data Safety disclosure.
- [ ] Complete Apple App Privacy questionnaire.

## Backend & payments
- [ ] Set `EXPO_PUBLIC_API_URL` to the production API only.
- [ ] Verify HTTPS/TLS on the API domain.
- [ ] Configure Razorpay production key/secret on the server; never ship the secret in the app.
- [ ] Test payment verification and webhook/reconciliation handling.
- [ ] Test stock validation for simultaneous orders.
- [ ] Test coupon expiry, minimum cart value, and invalid codes.
- [ ] Test COD order creation and cancellation rules.

## Notifications & analytics
- [ ] Create the EAS project and set `EXPO_PUBLIC_EAS_PROJECT_ID`.
- [ ] Configure Android/iOS push credentials.
- [ ] Deploy `/notifications/push-token` if push-token storage is required.
- [ ] Deploy `/analytics/events` if server-side analytics is required.
- [ ] Test notification routing to a product and an order from cold start.

## QA
- [ ] Test sign-in/register/logout.
- [ ] Test product search, filters, variants and out-of-stock states.
- [ ] Test wishlist persistence.
- [ ] Test cart quantity updates and cart clearing.
- [ ] Test address creation/edit/delete.
- [ ] Test online payment success, failure and cancellation.
- [ ] Test order history and tracking.
- [ ] Test slow/offline network states.
- [ ] Test Android physical device.
- [ ] Test iPhone physical device if publishing to iOS.

## Release
- [ ] Run `npx tsc --noEmit`.
- [ ] Run an EAS preview build and install the APK on a physical Android device.
- [ ] Verify production API and payment credentials in the preview build.
- [ ] Create the production AAB with EAS.
- [ ] Upload to Google Play internal testing first.
- [ ] Fix all blocking crashes before public release.

# Release validation — V23

- `package.json` and `expo.version` are synchronized at `1.4.0`.
- Removed the obsolete top-level `app.json.version`; Expo app version is defined only at `expo.version`.
- `scripts/release-check.mjs` now rejects a reintroduced top-level version field.
- `node scripts/release-check.mjs`: passed.
- JSON parse checks: passed for `package.json`, `app.json`, and `eas.json`.
- npm lockfile generation was attempted in offline mode but could not complete because required packages are not cached (`ENOTCACHED`).
- No dependency install, TypeScript compile, EAS build, or physical-device test is claimed.


- Placeholder production values are intentionally rejected by `release:check`.

## Release checker behavior
- `.env.example` is treated as documentation and may contain placeholders.
- If a real `.env` file exists, the checker validates that required values are not placeholders.
- CI/EAS builds must still receive real production environment values through their configured build environment.

## V26 typecheck fixes
- Flexible address/order API response typing so raw arrays and object envelopes can both be handled.
- Explicit string typing for checkout TextInput callbacks.
- Corrected coupon status style references to React Native StyleSheet entries.

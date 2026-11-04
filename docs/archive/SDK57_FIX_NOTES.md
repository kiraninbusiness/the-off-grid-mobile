# V30 Production Fixed (1.7.1)

- Removed direct @react-navigation/native dependency, which triggers the Expo Router SDK 56+ incompatibility check.
- Uses Expo Router's useFocusEffect.
- Added the hook to the project's TypeScript Expo Router declaration.
- Production API remains https://the-off-grid-api.onrender.com/api.

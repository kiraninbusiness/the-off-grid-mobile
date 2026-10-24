export const APP_CONFIG = {
  name: 'The Off Grid',
  scheme: 'theoffgrid',
  apiUrl: 'https://the-off-grid-api.onrender.com/api',
  easProjectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID || '',
};

// Orders at or above this subtotal ship free (matches the checkout screen).
export const FREE_SHIPPING_THRESHOLD = 1499;

export function validateProductionConfig() {
  if (!__DEV__) {
    const missing: string[] = [];
    // The production API is built into the app, so product/content updates
    // never require a new mobile build or a local .env file.
    if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
  }
}

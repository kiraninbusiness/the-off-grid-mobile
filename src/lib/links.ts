import {Alert, Linking} from 'react-native';

// The policy pages live on the website (same pages the site footer links to).
export const SITE_URL = 'https://theoffgrid.in';

export const PRIVACY_PATH = '/privacy-policy';
export const TERMS_PATH = '/terms-of-service';

export function openSitePage(path: string) {
  Linking.openURL(`${SITE_URL}${path}`).catch(() =>
    Alert.alert('Unable to open page', 'Please try again, or visit theoffgrid.in in your browser.'),
  );
}

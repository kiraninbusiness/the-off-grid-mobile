import React from 'react';
import {Text, StyleSheet} from 'react-native';
import {openSitePage, PRIVACY_PATH, TERMS_PATH} from '../lib/links';

// "By signing in you agree to our Terms of Service and Privacy Policy." with tappable links.
export default function LegalLinks({action}: {action: string}) {
  return (
    <Text style={s.text}>
      By {action} you agree to our{' '}
      <Text accessibilityRole="link" style={s.link} onPress={() => openSitePage(TERMS_PATH)}>
        Terms of Service
      </Text>{' '}
      and{' '}
      <Text accessibilityRole="link" style={s.link} onPress={() => openSitePage(PRIVACY_PATH)}>
        Privacy Policy
      </Text>
      .
    </Text>
  );
}

const s = StyleSheet.create({
  text: {fontSize: 11,fontFamily:'DMSans-Regular', lineHeight: 17, color: '#9A978F', marginTop: 16},
  link: {color: '#F2F0EA', textDecorationLine: 'underline', fontFamily:'DMSans-Bold'},
});

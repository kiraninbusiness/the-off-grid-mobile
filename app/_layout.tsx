import { Stack, usePathname, router } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { StoreProvider } from '../src/store/store';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { track } from '../src/lib/analytics';
import { validateProductionConfig } from '../src/lib/config';
import { reportError, installGlobalErrorHandlers } from '../src/lib/errorReporting';
import ErrorScreen from './error';

installGlobalErrorHandlers();

// expo-router renders this when a screen throws while rendering.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  useEffect(() => { reportError(error, { source: 'render', fatal: true }); }, [error]);
  return <ErrorScreen error={error} retry={retry} />;
}

function handleNotification(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const orderId = data.orderId;
  const productId = data.productId;
  const link = data.link;
  if (orderId != null) router.push(`/orders?orderId=${encodeURIComponent(String(orderId))}`);
  else if (productId != null) router.push(`/product/${encodeURIComponent(String(productId))}`);
  else if (typeof link === 'string' && link.startsWith('/') && !link.startsWith('//')) router.push(link as any);
}

function Gate() {
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try { validateProductionConfig(); } catch (e: any) {
      setConfigError(e?.message || 'Production configuration is incomplete.');
      setReady(true);
      return;
    }
    let mounted = true;
    let responseSub: { remove: () => void } | null = null;
    (async () => {
      const v = await AsyncStorage.getItem('offgrid_onboarded');
      if (!mounted) return;
      setOnboarded(v === '1');
      setReady(true);
      if (v === '1') {
        if (Constants.executionEnvironment !== 'storeClient') {
          try {
            const Notifications = await import('expo-notifications');
            Notifications.setNotificationHandler({
              handleNotification: async () => ({
                shouldShowAlert: true,
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
              }),
            });
            responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
              handleNotification(response.notification.request.content.data as Record<string, unknown>);
            });
            const last = await Notifications.getLastNotificationResponseAsync();
            if (last) handleNotification(last.notification.request.content.data as Record<string, unknown>);
          } catch {
            // Expo Go does not support Android remote notifications.
          }
        }
        track('app_opened').catch(() => {});
      }
    })();
    return () => { mounted = false; responseSub?.remove(); };
  }, []);

  useEffect(() => {
    if (!ready || configError || onboarded || pathname === '/onboarding') return;
    router.replace('/onboarding');
  }, [ready, configError, onboarded, pathname]);

  return <View style={{ flex: 1 }}>
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    {configError ? <View style={styles.root}><Text style={styles.logo}>THE OFF GRID</Text><Text style={styles.title}>SETUP REQUIRED</Text><Text style={styles.body}>{configError}</Text><Text style={styles.hint}>Set the production environment variables and rebuild the app.</Text></View> : null}
  </View>;
}

export default function Layout() {
  return <StoreProvider><Gate /></StoreProvider>;
}

const styles = StyleSheet.create({ root:{flex:1,backgroundColor:'#0a0a0a',padding:28,justifyContent:'center'}, logo:{color:'#fff',fontSize:14,fontWeight:'900',letterSpacing:2,marginBottom:42}, title:{color:'#fff',fontSize:30,fontWeight:'900',letterSpacing:-.5}, body:{color:'#ccc',fontSize:15,lineHeight:23,marginTop:18}, hint:{color:'#777',fontSize:13,lineHeight:20,marginTop:14} });

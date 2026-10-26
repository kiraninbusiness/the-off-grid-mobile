import {Platform} from 'react-native';
import Constants from 'expo-constants';
import {API_URL} from './api';

export type ErrorSource = 'render' | 'js' | 'promise' | 'native';

const DEDUPE_MS = 30_000;
const MAX_PER_SESSION = 20;
const recent = new Map<string, number>();
let sent = 0;

// Sends a technical error report to our own server. Never throws, never blocks the app,
// and sends no account or personal data. Disabled in development.
export function reportError(err: unknown, opts: {source?: ErrorSource; screen?: string; fatal?: boolean} = {}) {
  try {
    if (__DEV__ || sent >= MAX_PER_SESSION) return;
    const e: any = err;
    const message = String(e?.message ?? e ?? '').slice(0, 500);
    if (!message) return;
    const stack = String(e?.stack ?? '').slice(0, 4000);
    const key = `${message}|${stack.split('\n')[0]}`;
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUPE_MS) return;
    recent.set(key, now);
    sent += 1;
    fetch(`${API_URL}/client-errors`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        message,
        stack,
        source: opts.source ?? 'js',
        screen: opts.screen ?? '',
        fatal: opts.fatal === true,
        platform: Platform.OS,
        os_version: String(Platform.Version),
        app_version: Constants.expoConfig?.version ?? '',
      }),
    }).catch(() => {});
  } catch {
    // reporting must never cause another error
  }
}

// Called once at startup: chains the global JS error handler so crashes are reported first.
let installed = false;
export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;
  try {
    const g: any = globalThis;
    const EU = g.ErrorUtils;
    if (EU?.setGlobalHandler) {
      const previous = EU.getGlobalHandler?.();
      EU.setGlobalHandler((error: unknown, isFatal?: boolean) => {
        reportError(error, {source: 'js', fatal: !!isFatal});
        if (previous) previous(error, isFatal);
      });
    }
  } catch {
    // ignore
  }
}

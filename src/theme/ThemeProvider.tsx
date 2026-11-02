import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export const palettes = {
  light: { background:'#FFFFFF', surface:'#F6F6F4', card:'#FFFFFF', text:'#111111', muted:'#777777', border:'#E8E8E5', primary:'#111111', onPrimary:'#FFFFFF', tab:'#FFFFFF', danger:'#B42318' },
  dark: { background:'#090909', surface:'#141414', card:'#191919', text:'#F5F5F2', muted:'#A3A3A0', border:'#30302E', primary:'#F5F5F2', onPrimary:'#111111', tab:'#101010', danger:'#FF7770' },
} as const;
type ThemeContextValue = { preference: ThemePreference; setPreference: (value: ThemePreference) => Promise<void>; mode: 'light'|'dark'; colors: typeof palettes.light | typeof palettes.dark };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { AsyncStorage.getItem('offgrid_theme_preference').then(v => { if(v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v); }).catch(()=>{}).finally(()=>setLoaded(true)); }, []);
  const mode: 'light'|'dark' = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  useEffect(() => { Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference); }, [preference]);
  const setPreference = async (value: ThemePreference) => { setPreferenceState(value); try { await AsyncStorage.setItem('offgrid_theme_preference', value); } catch {} };
  const value = useMemo(() => ({ preference, setPreference, mode, colors: palettes[mode] }), [preference, mode]);
  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used inside ThemeProvider');
  return value;
}

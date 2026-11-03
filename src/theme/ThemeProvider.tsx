import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export const palettes = {
  light: { background:'#FFFFFF', surface:'#F6F6F4', card:'#FFFFFF', text:'#111111', muted:'#777777', border:'#E8E8E5', primary:'#111111', onPrimary:'#FFFFFF', tab:'#FFFFFF', danger:'#B42318', accent:'#FF3B30' },
  dark: { background:'#0A0A0A', surface:'#141414', card:'#141414', text:'#F2F0EA', muted:'#9A978F', border:'#2A2A2A', primary:'#F2F0EA', onPrimary:'#0A0A0A', tab:'#0A0A0A', danger:'#FF6B62', accent:'#FF3B30' },
} as const;
type ThemeContextValue = { preference: ThemePreference; setPreference: (value: ThemePreference) => Promise<void>; mode: 'light'|'dark'; colors: typeof palettes.light | typeof palettes.dark };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { AsyncStorage.getItem('offgrid_theme_preference').then(v => { if(v === 'light' || v === 'dark' || v === 'system') setPreferenceState(v); }).catch(()=>{}).finally(()=>setLoaded(true)); }, []);
  const mode: 'light'|'dark' = 'dark'; // The Off Grid is dark-only, matching the website
  useEffect(() => { Appearance.setColorScheme('dark'); }, [preference]);
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

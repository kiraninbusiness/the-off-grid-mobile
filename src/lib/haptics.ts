import * as Haptics from 'expo-haptics';

// Tiny taps for key actions. Never throws: devices without a vibration motor just do nothing.
export const tapLight = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); };
export const tapSuccess = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); };

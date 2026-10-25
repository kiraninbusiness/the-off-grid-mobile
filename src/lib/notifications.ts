import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {api} from './api';

export async function registerForPushNotifications() {
  if (!Device.isDevice || Constants.executionEnvironment === 'storeClient') return null;
  const Notifications = await import('expo-notifications');
  const existing=await Notifications.getPermissionsAsync();
  let status=existing.granted ? 'granted' : 'denied';
  if(status!=='granted') {
    const requested=await Notifications.requestPermissionsAsync();
    status=requested.granted ? 'granted' : 'denied';
  }
  if(status!=='granted') return null;
  if(Platform.OS==='android') await Notifications.setNotificationChannelAsync('drops',{name:'Drops & Orders',importance:Notifications.AndroidImportance.HIGH,sound:'default'});
  const projectId=process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if(!projectId) throw new Error('EAS project ID is not configured for push notifications.');
  const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
  await api.registerPushToken(token,Platform.OS);
  return token;
}

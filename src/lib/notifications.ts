import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import {API_URL, getToken} from './api';

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
  const token=(await Notifications.getExpoPushTokenAsync({projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID})).data;
  const auth=await getToken();
  if(auth) fetch(`${API_URL}/notifications/push-token`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth}`},body:JSON.stringify({token,platform:Platform.OS})}).catch(()=>{});
  return token;
}

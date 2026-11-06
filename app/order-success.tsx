import React from 'react';
import {View,Text,StyleSheet,Pressable,ScrollView} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';

export default function OrderSuccess(){
 const params=useLocalSearchParams<{orderId?:string|string[];payment?:string|string[]}>();
 const router=useRouter();
 const rawId=Array.isArray(params.orderId)?params.orderId[0]:params.orderId;
 const rawPayment=Array.isArray(params.payment)?params.payment[0]:params.payment;
 const orderId=String(rawId||'').trim();
 const online=rawPayment==='online';
 const pending=rawPayment==='pending';
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Text style={s.brand}>THE OFF GRID</Text>
  <View style={[s.icon,pending&&s.iconPending]}><Ionicons name={pending?'time-outline':'checkmark'} size={40} color="#0A0A0A"/></View>
  <Text style={s.kicker}>{online?'PAYMENT CONFIRMED':pending?'PAYMENT VERIFICATION PENDING':'ORDER PLACED'}</Text>
  <Text style={s.title}>{pending?'PLEASE CHECK YOUR ORDER.':online?'YOU’RE ALL SET.':'THANK YOU.'}</Text>
  <Text style={s.copy}>{pending?'Your payment result was received, but we could not confirm it with the server just now. Do not try to pay again yet. Open My Orders and refresh the status before taking further action.':online?'Your payment was verified successfully. We’ll keep you updated as your order moves forward.':'Your order has been received. You can follow its progress from your account.'}</Text>
  {!!orderId&&<View style={s.orderBox}><Text style={s.orderLabel}>ORDER REFERENCE</Text><Text selectable style={s.orderNumber}>#{orderId}</Text><Text style={s.orderHint}>{pending?'Keep this reference. Check its payment status in My Orders before trying another payment.':'Keep this reference for your records.'}</Text></View>}
  <View style={s.info}><Ionicons name="notifications-outline" size={20} color="#F2F0EA"/><View style={s.infoText}><Text style={s.infoTitle}>STAY IN THE LOOP</Text><Text style={s.infoCopy}>Open My Orders to see the latest status and shipment tracking details when available.</Text></View></View>
  <Pressable accessibilityRole="button" style={s.primary} onPress={()=>router.replace(orderId?('/orders?orderId='+encodeURIComponent(orderId)):'/orders')}><Text style={s.primaryText}>VIEW MY ORDER  →</Text></Pressable>
  <Pressable accessibilityRole="button" style={s.secondary} onPress={()=>router.replace('/(tabs)/shop')}><Text style={s.secondaryText}>CONTINUE SHOPPING</Text></Pressable>
  <Text style={[s.footer,{color:'#FFFFFF'}]}>MADE FOR YOUR EVERYDAY. BUILT TO LAST.</Text>
 </ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#0A0A0A'},content:{flexGrow:1,padding:26,paddingTop:62,paddingBottom:42,justifyContent:'center'},brand:{fontSize:11,fontFamily:'SpaceGrotesk-Bold',letterSpacing:2,color:'#F2F0EA',marginBottom:54},icon:{width:72,height:72,borderRadius:36,backgroundColor:'#F2F0EA',alignItems:'center',justifyContent:'center',marginBottom:30},iconPending:{backgroundColor:'#8a6b18'},kicker:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:2,color:'#9A978F'},title:{fontSize:39,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-1.8,color:'#F2F0EA',marginTop:10},copy:{fontSize:13,fontFamily:'DMSans-Regular',lineHeight:21,color:'#A8A59D',marginTop:14,maxWidth:340},orderBox:{borderWidth:1,borderColor:'#2A2A2A',padding:18,marginTop:30},orderLabel:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.5,color:'#9A978F'},orderNumber:{fontSize:27,fontFamily:'SpaceGrotesk-Bold',letterSpacing:-.5,color:'#F2F0EA',marginTop:8},orderHint:{fontSize:10,fontFamily:'DMSans-Regular',color:'#9A978F',marginTop:7},info:{flexDirection:'row',gap:12,alignItems:'flex-start',backgroundColor:'#141414',padding:15,marginTop:20},infoText:{flex:1},infoTitle:{fontSize:9,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.1,color:'#F2F0EA'},infoCopy:{fontSize:11,fontFamily:'DMSans-Regular',lineHeight:17,color:'#A8A59D',marginTop:6},primary:{backgroundColor:'#F2F0EA',padding:17,alignItems:'center',marginTop:28},primaryText:{color:'#0A0A0A',fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},secondary:{borderWidth:1,borderColor:'#F2F0EA',padding:16,alignItems:'center',marginTop:10},secondaryText:{color:'#F2F0EA',fontSize:10,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},footer:{fontSize:8,fontFamily:'SpaceGrotesk-Bold',letterSpacing:1.2,color:'#77746E',textAlign:'center',marginTop:38}});

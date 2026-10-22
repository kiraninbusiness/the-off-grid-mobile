import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ScrollView,Text,TextInput,Pressable,StyleSheet,Alert,View,ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import {useStore} from '../src/store/store';
import {api} from '../src/lib/api';

export default function Checkout(){
 const {cart,user,refresh}=useStore(); const r=useRouter();
 const [f,setF]=useState({name:user?.name||'',phone:'',email:user?.email||'',address:'',city:'',state:'',pincode:''});
 const set=(k:string,v:string)=>setF(x=>({...x,[k]:v}));
 const [savedAddresses,setSavedAddresses]=useState<any[]>([]); const [couponCode,setCouponCode]=useState(''),[coupon,setCoupon]=useState<any>(null),[couponMsg,setCouponMsg]=useState('');
 const [payment,setPayment]=useState<'cod'|'online'>('cod'),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false);
 const checkoutInFlight=useRef(false);
 const razorpayConfigured=Boolean(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID);
 useEffect(()=>{if(!razorpayConfigured && payment==='online')setPayment('cod')},[razorpayConfigured,payment]);
 useEffect(()=>{if(user){api.addresses().then(x=>setSavedAddresses(Array.isArray(x)?x:(x?.items||x?.addresses||[]))).catch(()=>{})}},[user]);
 const subtotal=useMemo(()=>cart.reduce((a,x)=>a+Number(x.price||0)*x.quantity,0),[cart]);
 const discount=Number(coupon?.discount||0); const shipping=subtotal>=1499?0:99; const total=Math.max(0,subtotal+shipping-discount);
 const applyCoupon=async()=>{if(!couponCode.trim())return;setChecking(true);setCouponMsg('');try{const x=await api.validateCoupon(couponCode.trim(),subtotal);setCoupon(x);setCouponMsg(`Applied · You save ₹${Number(x.discount||0).toLocaleString('en-IN')}`)}catch(e:any){setCoupon(null);setCouponMsg(e.message||'Invalid coupon')}finally{setChecking(false)}};
 const place=async()=>{
  if(checkoutInFlight.current)return;
  if(!cart.length)return Alert.alert('Your bag is empty');
  if(!f.name||!/^[6-9][0-9]{9}$/.test(f.phone.replace(/\D/g,''))||!f.address||!f.city||!f.state||!/^[0-9]{6}$/.test(f.pincode))return Alert.alert('Complete your delivery details','Enter a valid 10-digit Indian mobile number and 6-digit PIN code.');
  checkoutInFlight.current=true;
  setBusy(true);
  try{
   const response=await api.createOrder({items:cart.map(x=>({productId:Number(x.product_id),quantity:Number(x.quantity),selectedSize:x.selected_size||null,selectedColor:x.selected_color||null})),shipping:{...f,email:f.email.toLowerCase()},payment_method:payment,coupon_code:coupon?.code||''});
   const order=response?.order||response?.data?.order||response;
   if(!order?.id)throw new Error('The server did not return a valid order. Please try again.');
   if(payment==='cod'){await refresh();Alert.alert('Order confirmed',`Order #${order.id}`,[{text:'VIEW ORDER',onPress:()=>r.replace('/orders') }]);return;}
   let Razorpay:any;
   try{Razorpay=require('react-native-razorpay').default||require('react-native-razorpay');}catch{await api.cancelPayment(order.id);throw new Error('Online payments require a development/production build with Razorpay enabled. Use COD in Expo Go.');}
   const options={description:'THE OFF GRID order',image:'https://theoffgrid.in/favicon.ico',currency:'INR',key:process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,amount:Math.round(Number(order.total||total)*100),name:'THE OFF GRID',order_id:order.razorpay_order_id,prefill:{name:f.name,email:f.email,contact:f.phone},theme:{color:'#111111'}};
   if(!options.key){await api.cancelPayment(order.id).catch(()=>{});throw new Error('Razorpay key is not configured.');}
   let result:any;
   try { result=await Razorpay.open(options); } catch (paymentError:any) { await api.cancelPayment(order.id).catch(()=>{}); throw new Error(paymentError?.description||paymentError?.message||'Payment was cancelled.'); }
   const verified=await api.verifyPayment({orderId:order.id,razorpay_order_id:result.razorpay_order_id,razorpay_payment_id:result.razorpay_payment_id,razorpay_signature:result.razorpay_signature});
   await refresh();Alert.alert('Payment successful',`Order #${verified.id||order.id}`,[{text:'VIEW ORDER',onPress:()=>r.replace('/orders')}]);
  }catch(e:any){Alert.alert('Checkout failed',e.message||'Please try again.')}finally{checkoutInFlight.current=false;setBusy(false)}
 };
 if(!user)return <View style={s.center}><Text style={s.title}>CHECKOUT</Text><Text style={s.note}>Sign in before checkout.</Text><Pressable style={s.btn} onPress={()=>r.push('/(tabs)/profile')}><Text style={s.btnText}>SIGN IN</Text></Pressable></View>;
 return <ScrollView style={s.page} contentContainerStyle={{paddingBottom:40}}><Text style={s.eyebrow}>THE OFF GRID / CHECKOUT</Text><Text style={s.title}>CHECKOUT</Text>
  <Section title="SAVED ADDRESSES">{savedAddresses.length>0?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>{savedAddresses.map((a:any)=><Pressable key={a.id} style={s.saved} onPress={()=>setF(x=>({...x,name:a.name||x.name,phone:a.phone||x.phone,address:a.address||x.address,city:a.city||x.city,state:a.state||x.state,pincode:String(a.pincode||x.pincode)}))}><Text style={s.savedTitle}>{a.label||'ADDRESS'}{a.is_default?' · DEFAULT':''}</Text><Text style={s.savedText}>{a.address}, {a.city}</Text><Text style={s.savedText}>{a.state} — {a.pincode}</Text></Pressable>)}</ScrollView>:<Text style={s.emptySaved}>No saved addresses found.</Text>}</Section><Section title="DELIVERY"><Input label="Full name" value={f.name} onChangeText={(v:string)=>set('name',v)}/><Input label="Phone" value={f.phone} onChangeText={(v:string)=>set('phone',v)} keyboardType="phone-pad"/><Input label="Email" value={f.email} onChangeText={(v:string)=>set('email',v)} keyboardType="email-address"/><Input label="Address" value={f.address} onChangeText={(v:string)=>set('address',v)}/><View style={s.two}><Input label="City" value={f.city} onChangeText={(v:string)=>set('city',v)} wide/><Input label="State" value={f.state} onChangeText={(v:string)=>set('state',v)} wide/></View><Input label="PIN code" value={f.pincode} onChangeText={(v:string)=>set('pincode',v.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad"/></Section>
  <Section title="PROMO"><View style={s.coupon}><TextInput placeholder="COUPON CODE" value={couponCode} onChangeText={setCouponCode} autoCapitalize="characters" style={s.couponInput}/><Pressable onPress={applyCoupon} style={s.apply}><Text style={s.applyText}>{checking?'…':'APPLY'}</Text></Pressable></View>{couponMsg?<Text style={[s.msg,coupon?s.ok:s.bad]}>{couponMsg}</Text>:null}</Section>
  <Section title="PAYMENT"><Pressable style={[s.pay,payment==='cod'&&s.selected]} onPress={()=>setPayment('cod')}><View><Text style={s.payTitle}>CASH ON DELIVERY</Text><Text style={s.paySub}>Pay when your order arrives</Text></View><Text>{payment==='cod'?'●':'○'}</Text></Pressable><Pressable disabled={!razorpayConfigured} style={[s.pay,payment==='online'&&s.selected,!razorpayConfigured&&s.disabledPay]} onPress={()=>razorpayConfigured&&setPayment('online')}><View><Text style={s.payTitle}>ONLINE PAYMENT</Text><Text style={s.paySub}>{razorpayConfigured?'UPI · Cards · Netbanking · Razorpay':'Online payment unavailable — configure Razorpay'}</Text></View><Text>{payment==='online'?'●':'○'}</Text></Pressable></Section>
  <View style={s.summary}><Line label="Subtotal" value={subtotal}/><Line label="Shipping" value={shipping}/>{discount>0&&<Line label="Coupon" value={-discount}/>}<View style={s.totalRow}><Text style={s.totalLabel}>TOTAL</Text><Text style={s.total}>₹{total.toLocaleString('en-IN')}</Text></View></View>
  <Pressable disabled={busy} style={[s.btn,busy&&{opacity:.6}]} onPress={place}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.btnText}>{payment==='cod'?'PLACE COD ORDER':'PAY SECURELY'} · ₹{total.toLocaleString('en-IN')}</Text>}</Pressable>
 </ScrollView>
}
function Input({label,wide,...props}:any){return <View style={wide?s.wideInput:{}}><Text style={s.label}>{label}</Text><TextInput {...props} style={s.input}/></View>}
function Section({title,children}:any){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>}
function Line({label,value}:{label:string,value:number}){return <View style={s.line}><Text style={s.lineLabel}>{label}</Text><Text style={s.lineValue}>{value<0?'- ':''}₹{Math.abs(value).toLocaleString('en-IN')}</Text></View>}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#fff',padding:22,paddingTop:58},center:{flex:1,backgroundColor:'#fff',padding:24,paddingTop:80},eyebrow:{fontSize:9,letterSpacing:1.5,color:'#777'},title:{fontSize:42,fontWeight:'900',letterSpacing:-2,marginBottom:25},note:{color:'#777',marginBottom:18},section:{borderTopWidth:1,borderTopColor:'#ddd',paddingTop:17,marginTop:20},sectionTitle:{fontSize:10,fontWeight:'900',letterSpacing:1.4,marginBottom:12},label:{fontSize:9,color:'#777',letterSpacing:1,marginBottom:4},input:{borderBottomWidth:1,borderBottomColor:'#111',paddingVertical:11,marginBottom:14,fontSize:15},two:{flexDirection:'row',gap:12},wideInput:{flex:1},coupon:{flexDirection:'row',borderWidth:1,borderColor:'#bbb'},couponInput:{flex:1,padding:13,fontSize:12},saved:{borderWidth:1,borderColor:'#ddd',padding:12,width:220},savedTitle:{fontSize:9,fontWeight:'900',letterSpacing:1},savedText:{fontSize:10,color:'#666',marginTop:4},emptySaved:{fontSize:11,color:'#777'},apply:{backgroundColor:'#111',paddingHorizontal:18,justifyContent:'center'},applyText:{color:'#fff',fontWeight:'900',fontSize:10},msg:{fontSize:11,marginTop:8},ok:{color:'#16803b'},bad:{color:'#b42318'},pay:{borderWidth:1,borderColor:'#ddd',padding:15,marginBottom:9,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},selected:{borderColor:'#111'},payTitle:{fontWeight:'900',fontSize:10,letterSpacing:1},paySub:{fontSize:10,color:'#777',marginTop:4},disabledPay:{opacity:.55},summary:{borderTopWidth:1,borderTopColor:'#ddd',marginTop:25,paddingTop:15},line:{flexDirection:'row',justifyContent:'space-between',paddingVertical:5},lineLabel:{fontSize:12,color:'#666'},lineValue:{fontSize:12},totalRow:{borderTopWidth:1,borderTopColor:'#111',marginTop:10,paddingTop:15,flexDirection:'row',justifyContent:'space-between'},totalLabel:{fontWeight:'900'},total:{fontSize:24,fontWeight:'900'},btn:{backgroundColor:'#111',padding:18,alignItems:'center',marginTop:22},btnText:{color:'#fff',fontWeight:'900',letterSpacing:1,fontSize:10}});

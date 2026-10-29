import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ScrollView,Text,TextInput,Pressable,StyleSheet,Alert,View,ActivityIndicator} from 'react-native';
import {useRouter} from 'expo-router';
import {useStore} from '../src/store/store';
import {api} from '../src/lib/api';

const savedField=(address:any,key:string)=>address?.[key]??(address?.address&&typeof address.address==='object'?address.address[key]:undefined);
const savedStreet=(address:any)=>typeof address?.address==='string'?address.address:String(address?.address_line1??address?.line1??savedField(address,'address_line1')??savedField(address,'line1')??savedField(address,'street')??'');

export default function Checkout(){
 const {cart,user,refresh}=useStore(); const r=useRouter();
 const [f,setF]=useState({name:user?.name||'',phone:'',email:user?.email||'',address:'',city:'',state:'',pincode:''});
 const deliveryRequestId=useRef(0);
 const set=(k:string,v:string)=>{setF(x=>({...x,[k]:v}));if(k==='pincode'){deliveryRequestId.current++;setDeliveryStatus('');setDeliveryCheckBusy(false)}};
 const checkDelivery=async()=>{const pin=f.pincode.trim();if(!/^[1-9][0-9]{5}$/.test(pin)){deliveryRequestId.current++;setDeliveryCheckBusy(false);setDeliveryStatus('Enter a valid 6-digit Indian PIN code first.');return}if(deliveryCheckBusy)return;const requestId=++deliveryRequestId.current;setDeliveryCheckBusy(true);setDeliveryStatus('Checking delivery availability…');try{const response=await api.serviceability(pin);if(requestId!==deliveryRequestId.current)return;const result=response?.data??response?.result??response;const raw=result?.serviceable??result?.is_serviceable??result?.deliverable??result?.available??result?.serviceability;const available=typeof raw==='boolean'?raw:typeof raw==='number'?(raw===0||raw===1?raw===1:undefined):typeof raw==='string'?['yes','true','1','available','serviceable','deliverable'].includes(raw.trim().toLowerCase())?true:['no','false','0','unavailable','not serviceable','not_serviceable'].includes(raw.trim().toLowerCase())?false:undefined:undefined;if(available===true)setDeliveryStatus('Delivery is available for this PIN code.');else if(available===false)setDeliveryStatus('Sorry, delivery is not available for this PIN code.');else setDeliveryStatus(result?.message||result?.reason||'We could not confirm availability. You can continue; the server will validate delivery when you place the order.')}catch(e:any){if(requestId===deliveryRequestId.current)setDeliveryStatus(e?.message||'Could not check delivery right now. You can try again or continue to checkout.')}finally{if(requestId===deliveryRequestId.current)setDeliveryCheckBusy(false)}};
 const [savedAddresses,setSavedAddresses]=useState<any[]>([]); const [couponCode,setCouponCode]=useState(''),[coupon,setCoupon]=useState<any>(null),[couponMsg,setCouponMsg]=useState('');
 const [loyaltyPoints,setLoyaltyPoints]=useState(0),[redeemInput,setRedeemInput]=useState('0'),[loyaltyMsg,setLoyaltyMsg]=useState('');
 const [payment,setPayment]=useState<'cod'|'online'>('cod'),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[couponBusy,setCouponBusy]=useState(false);
 const [deliveryCheckBusy,setDeliveryCheckBusy]=useState(false),[deliveryStatus,setDeliveryStatus]=useState('');
 const checkoutInFlight=useRef(false),couponLock=useRef(false);
 const razorpayConfigured=Boolean(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID);
 useEffect(()=>{if(!razorpayConfigured && payment==='online')setPayment('cod')},[razorpayConfigured,payment]);
 useEffect(()=>{if(user){api.addresses().then(x=>setSavedAddresses(Array.isArray(x)?x:(x?.items||x?.addresses||[]))).catch(()=>{});api.customerLoyalty().then((x:any)=>{const n=Number(x?.points);setLoyaltyPoints(Number.isFinite(n)&&n>0?Math.floor(n):0)}).catch(()=>setLoyaltyPoints(0))}else{setLoyaltyPoints(0);setRedeemInput('0')}},[user]);
 const subtotal=useMemo(()=>cart.reduce((a,x)=>a+Number(x.price||0)*x.quantity,0),[cart]);
 const cartSignature=useMemo(()=>JSON.stringify(cart.map(x=>({product_id:x.product_id,price:x.price,quantity:x.quantity,size:x.selected_size||'',color:x.selected_color||''}))),[cart]);
 useEffect(()=>{if(coupon&&(Number(coupon.applied_subtotal)!==subtotal||coupon.applied_cart_signature!==cartSignature)){setCoupon(null);setCouponMsg('Your bag items or total changed. Apply the coupon again to refresh your discount.')}},[subtotal,cartSignature,coupon]);
 const discount=coupon&&Number(coupon.applied_subtotal)===subtotal&&coupon.applied_cart_signature===cartSignature?Number(coupon.discount||0):0; const shipping=subtotal>=1499?0:79;
 const redeemRequested=Math.max(0,Math.floor(Number(redeemInput)||0));
 const pointsToRedeem=Math.min(redeemRequested,loyaltyPoints,Math.max(0,Math.floor(subtotal-discount)));
 const total=Math.max(0,subtotal+shipping-discount-pointsToRedeem);
 const applyCoupon=async()=>{if(couponBusy||couponLock.current)return;if(!couponCode.trim()){setCoupon(null);setCouponMsg('Enter a coupon code first.');return}couponLock.current=true;setCouponBusy(true);setChecking(true);setCouponMsg('');try{const x=await api.validateCoupon(couponCode.trim().toUpperCase(),subtotal);const amount=Number(x?.discount);if(!Number.isFinite(amount)||amount<0||amount>subtotal)throw new Error('The server returned an invalid discount. Please try another code.');setCoupon({...x,discount:amount,code:x?.code||couponCode.trim().toUpperCase(),applied_subtotal:subtotal,applied_cart_signature:cartSignature});setCouponMsg(`Applied · You save ₹${amount.toLocaleString('en-IN')}`)}catch(e:any){setCoupon(null);setCouponMsg(e.message||'Invalid coupon')}finally{couponLock.current=false;setChecking(false);setCouponBusy(false)}};
 const place=async()=>{
  if(checkoutInFlight.current)return;
  if(!cart.length)return Alert.alert('Your bag is empty','Add a piece before checking out.');
  if(!Number.isFinite(subtotal)||subtotal<=0||cart.some(x=>!Number.isFinite(Number(x.product_id))||Number(x.product_id)<=0||!Number.isInteger(Number(x.quantity))||Number(x.quantity)<1||Number(x.quantity)>10||!Number.isFinite(Number(x.price))||Number(x.price)<=0))return Alert.alert('Check your bag','One or more items have invalid product, price or quantity details. Return to your bag and try again.');
  if(!f.name.trim()||!/^[6-9][0-9]{9}$/.test(f.phone.replace(/\D/g,''))||!f.address.trim()||!f.city.trim()||!f.state.trim()||!/^[1-9][0-9]{5}$/.test(f.pincode))return Alert.alert('Complete your delivery details','Enter your name, address, city and state, a valid 10-digit Indian mobile number and a 6-digit PIN code.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()))return Alert.alert('Check your email','Enter a valid email address. It is required for order confirmation.');
  checkoutInFlight.current=true;
  setBusy(true);
  let orderStatusUncertain=false;
  try{
   const catalogueResults=await Promise.all(cart.map(async(item:any)=>{try{const response:any=await api.product(String(item.product_id));const product=response?.product??response?.data?.product??response?.data??response;if(!product||String(product.id??product.product_id)!==String(item.product_id))return `Could not confirm ${item.name||'an item'} in the catalogue. Return to your bag and try again.`;const livePrice=Number(product.price);if(!Number.isFinite(livePrice)||livePrice<=0)return `The current price for ${item.name||'an item'} is unavailable. Return to your bag and try again.`;if(Math.abs(livePrice-Number(item.price))>0.009)return `The price for ${item.name||'an item'} has changed to ₹${livePrice.toLocaleString('en-IN')}. Return to your bag to review it before ordering.`;const stockRaw=product.stock_quantity??product.inventory??product.stockCount??product.stock;const stock=typeof stockRaw==='number'?stockRaw:typeof stockRaw==='string'&&stockRaw.trim()!==''&&Number.isFinite(Number(stockRaw))?Number(stockRaw):null;if((stock!==null&&stock<=0)||product.in_stock===false||product.is_available===false)return `${item.name||'An item'} is currently unavailable. Remove it from your bag.`;const variants=Array.isArray(product.variants)?product.variants:[];if(variants.length&&(item.selected_size||item.selected_color)){const variant=variants.find((v:any)=>String(v.size??'').trim().toLowerCase()===String(item.selected_size||'').trim().toLowerCase()&&String(v.color??v.colour??'').trim().toLowerCase()===String(item.selected_color||'').trim().toLowerCase());if(!variant)return `The selected size/colour for ${item.name||'an item'} is no longer available. Return to your bag and choose another.`;const raw=variant.stock_quantity??variant.stock??variant.inventory;const qty=typeof raw==='number'?raw:typeof raw==='string'&&raw.trim()!==''&&Number.isFinite(Number(raw))?Number(raw):null;if(qty!==null&&qty<Number(item.quantity))return qty<=0?`${item.name||'This variant'} is sold out. Remove it or choose another.`:`Only ${qty} of ${item.name||'this variant'} remain. Reduce the quantity in your bag.`;}return null}catch{return 'We could not verify the latest catalogue price and availability. Check your connection and try again.'}}));const catalogueIssue=catalogueResults.find(Boolean);if(catalogueIssue)throw new Error(catalogueIssue);const orderItems=cart.map(x=>({productId:Number(x.product_id),quantity:Number(x.quantity),selectedSize:x.selected_size?.trim()||null,selectedColor:x.selected_color?.trim()||null}));const shippingDetails={name:f.name.trim(),phone:f.phone.replace(/\D/g,''),email:f.email.trim().toLowerCase(),address:f.address.trim(),city:f.city.trim(),state:f.state.trim(),pincode:f.pincode.trim()};
   let response:any;
   try {
    response=await api.createOrder({items:orderItems,shipping:shippingDetails,payment_method:payment,coupon_code:coupon?.code||'',redeem_points:pointsToRedeem});
   } catch(createError:any) {
    // A received 4xx is a definite rejection; network failures and 5xx responses
    // may occur after the server has committed the order, so those are uncertain.
    orderStatusUncertain=!createError?.status||Number(createError.status)>=500;
    throw createError;
   }
   const order=response?.order||response?.data?.order||response;
   if(!order?.id){orderStatusUncertain=true;throw new Error('The server did not return a valid order. Please check My Orders before trying again.');}
   if(payment==='cod'){try{await refresh()}catch{}r.replace({pathname:'/order-success',params:{orderId:String(order.id),payment:'cod'}});return;}
   let Razorpay:any;
   try{Razorpay=require('react-native-razorpay').default||require('react-native-razorpay');}catch{await api.cancelPayment(order.id);throw new Error('Online payments require a development/production build with Razorpay enabled. Use COD in Expo Go.');}
   const serverTotal=Number(order.total);
   if(!order.razorpay_order_id||!Number.isFinite(serverTotal)||serverTotal<=0){await api.cancelPayment(order.id).catch(()=>{});throw new Error('The server did not return a valid payment order and total. Your order was not sent to Razorpay; please retry or use COD.');}
   const options={description:'THE OFF GRID order',image:'https://theoffgrid.in/favicon.ico',currency:'INR',key:process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID,amount:Math.round(serverTotal*100),name:'THE OFF GRID',order_id:order.razorpay_order_id,prefill:{name:f.name.trim(),email:f.email.trim(),contact:f.phone.replace(/\D/g,'')},theme:{color:'#111111'}};
   if(!options.key){await api.cancelPayment(order.id).catch(()=>{});throw new Error('Razorpay key is not configured.');}
   let result:any;
   try { result=await Razorpay.open(options); } catch (paymentError:any) { await api.cancelPayment(order.id).catch(()=>{}); throw new Error(paymentError?.description||paymentError?.message||'Payment was cancelled.'); }
   let verified:any;
   try{verified=await api.verifyPayment({orderId:order.id,razorpay_order_id:result.razorpay_order_id,razorpay_payment_id:result.razorpay_payment_id,razorpay_signature:result.razorpay_signature});}
   catch{r.replace({pathname:'/order-success',params:{orderId:String(order.id),payment:'pending'}});return;}
   try{await refresh()}catch{}r.replace({pathname:'/order-success',params:{orderId:String(verified?.id||order.id),payment:'online'}});
  }catch(e:any){
   if(orderStatusUncertain){
    Alert.alert('ORDER STATUS UNCERTAIN','We could not confirm the result of your order request. The order may already have been created. Check My Orders before trying again.',[{text:'CHECK MY ORDERS',onPress:()=>r.replace('/orders')},{text:'STAY HERE',style:'cancel'}]);
   }else Alert.alert('Checkout failed',e.message||'Please try again.');
  }finally{checkoutInFlight.current=false;setBusy(false)}
 };
 if(!user)return <View style={s.center}><Text style={s.title}>CHECKOUT</Text><Text style={s.note}>Sign in before checkout.</Text><Pressable style={s.btn} onPress={()=>r.push('/(tabs)/profile')}><Text style={s.btnText}>SIGN IN</Text></Pressable></View>;
 return <ScrollView style={s.page} contentContainerStyle={{paddingBottom:40}}><Text style={s.eyebrow}>THE OFF GRID / CHECKOUT</Text><Text style={s.title}>CHECKOUT</Text><View style={s.progress}><View style={s.progressStep}><Text style={s.progressNumber}>01</Text><Text style={s.progressLabel}>DELIVERY</Text></View><View style={s.progressLine}/><View style={s.progressStep}><Text style={s.progressNumber}>02</Text><Text style={s.progressLabel}>PAYMENT</Text></View><View style={s.progressLine}/><View style={s.progressStep}><Text style={s.progressNumber}>03</Text><Text style={s.progressLabel}>REVIEW</Text></View></View>
  <Section title="SAVED ADDRESSES">{savedAddresses.length>0?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:10}}>{savedAddresses.map((a:any,index:number)=><Pressable key={String(a.id??index)} accessibilityRole="button" accessibilityLabel={`Use saved address ${a.label||index+1}`} style={s.saved} onPress={()=>setF(x=>({...x,name:savedField(a,'name')||savedField(a,'full_name')||x.name,phone:savedField(a,'phone')||savedField(a,'mobile')||x.phone,address:savedStreet(a)||x.address,city:savedField(a,'city')||x.city,state:savedField(a,'state')||x.state,pincode:String(savedField(a,'pincode')||savedField(a,'postal_code')||x.pincode)}))}><Text style={s.savedTitle}>{savedField(a,'label')||'ADDRESS'}{savedField(a,'is_default')||savedField(a,'isDefault')?' · DEFAULT':''}</Text><Text style={s.savedText}>{savedStreet(a)}{savedField(a,'city')?', ':''}{savedField(a,'city')||''}</Text><Text style={s.savedText}>{savedField(a,'state')||''}{savedField(a,'pincode')||savedField(a,'postal_code')?' — ':''}{savedField(a,'pincode')||savedField(a,'postal_code')||''}</Text></Pressable>)}</ScrollView>:<Text style={s.emptySaved}>No saved addresses found.</Text>}</Section><Section title="DELIVERY"><Input label="Full name" value={f.name} onChangeText={(v:string)=>set('name',v)}/><Input label="Phone" value={f.phone} onChangeText={(v:string)=>set('phone',v)} keyboardType="phone-pad"/><Input label="Email" value={f.email} onChangeText={(v:string)=>set('email',v)} keyboardType="email-address"/><Input label="Address" value={f.address} onChangeText={(v:string)=>set('address',v)}/><View style={s.two}><Input label="City" value={f.city} onChangeText={(v:string)=>set('city',v)} wide/><Input label="State" value={f.state} onChangeText={(v:string)=>set('state',v)} wide/></View><Input label="PIN code" value={f.pincode} onChangeText={(v:string)=>set('pincode',v.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad"/><Pressable accessibilityRole="button" accessibilityLabel="Check delivery availability" disabled={deliveryCheckBusy} onPress={checkDelivery} style={[s.deliveryCheck,deliveryCheckBusy&&{opacity:.6}]}>{deliveryCheckBusy?<ActivityIndicator color="#111"/>:<Text style={s.deliveryCheckText}>CHECK DELIVERY</Text>}</Pressable>{deliveryStatus?<Text accessibilityLiveRegion="polite" style={[s.deliveryStatus,deliveryStatus.startsWith("Delivery is available")?s.ok:deliveryStatus.startsWith("Sorry")?s.bad:{color:"#666"}]}>{deliveryStatus}</Text>:null}</Section>
  <Section title="YOUR ORDER">{cart.map((item:any,index:number)=><View key={`${item.product_id}|${item.selected_size||""}|${item.selected_color||""}|${index}`} style={s.reviewItem}><View style={s.reviewDetails}><Text style={s.reviewName}>{item.name||"Product"}</Text><Text style={s.reviewVariant}>{item.selected_size?`Size ${item.selected_size}`:"Size not selected"}{item.selected_color?` · ${item.selected_color}`:""} · Qty {item.quantity}</Text><Text style={s.reviewUnit}>₹{Number(item.price||0).toLocaleString("en-IN")} each</Text></View><Text style={s.reviewTotal}>₹{(Number(item.price||0)*Number(item.quantity||0)).toLocaleString("en-IN")}</Text></View>)}<Text style={s.reviewNote}>Check each item, size, colour and quantity before placing your order.</Text></Section>
  <Section title="PROMO"><View style={s.coupon}><TextInput placeholder="COUPON CODE" value={couponCode} onChangeText={(v:string)=>{setCouponCode(v);if(coupon||couponMsg){setCoupon(null);setCouponMsg("");}}} autoCapitalize="characters" style={s.couponInput}/><Pressable disabled={couponBusy} onPress={applyCoupon} style={[s.apply,couponBusy&&{opacity:.6}]}><Text style={s.applyText}>{checking?'…':'APPLY'}</Text></Pressable></View>{couponMsg?<Text style={[s.msg,coupon?s.ok:s.bad]}>{couponMsg}</Text>:null}</Section>
  <Section title="OFF GRID CLUB / REDEEM POINTS"><View style={s.loyaltyCard}><Text style={s.loyaltyBalance}>{loyaltyPoints.toLocaleString('en-IN')} POINTS AVAILABLE</Text><Text style={s.loyaltyHint}>1 point = ₹1 off your order. Points are checked again by the server.</Text></View><View style={s.coupon}><TextInput value={redeemInput} onChangeText={(v:string)=>{setRedeemInput(v.replace(/[^0-9]/g,'').slice(0,8));setLoyaltyMsg('')}} keyboardType="number-pad" placeholder="POINTS TO REDEEM" accessibilityLabel="Loyalty points to redeem" style={s.couponInput}/><Pressable disabled={!loyaltyPoints} onPress={()=>{const n=Math.min(loyaltyPoints,Math.max(0,Math.floor(subtotal-discount)));setRedeemInput(String(n));setLoyaltyMsg(n?'Maximum available points applied.':'There are no points available to redeem on this subtotal.')}} style={[s.apply,!loyaltyPoints&&{opacity:.45}]}><Text style={s.applyText}>USE MAX</Text></Pressable></View>{pointsToRedeem>0&&<Text style={[s.msg,s.ok]}>Applied · You save ₹{pointsToRedeem.toLocaleString('en-IN')}</Text>}{!!loyaltyMsg&&<Text style={s.msg}>{loyaltyMsg}</Text>}</Section>
  <Section title="PAYMENT"><View style={s.paymentRow}>{['cod','online'].map(method=><Pressable key={method} disabled={method==='online'&&!razorpayConfigured} onPress={()=>setPayment(method as 'cod'|'online')} style={[s.payment, payment===method&&s.paymentActive,method==='online'&&!razorpayConfigured&&{opacity:.45}]}><Text style={[s.paymentText,payment===method&&s.paymentTextActive]}>{method==='cod'?'CASH ON DELIVERY':razorpayConfigured?'RAZORPAY / UPI / CARD':'ONLINE PAYMENT (BUILD REQUIRED)'}</Text></Pressable>)}</View></Section>
  <View style={s.summary}><Text style={s.sumLine}>SUBTOTAL <Text>₹{subtotal.toLocaleString('en-IN')}</Text></Text><Text style={s.sumLine}>SHIPPING <Text>{shipping?'₹'+shipping:'FREE'}</Text></Text>{discount>0&&<Text style={s.sumLine}>DISCOUNT <Text>−₹{discount.toLocaleString('en-IN')}</Text></Text>}{pointsToRedeem>0&&<Text style={s.sumLine}>LOYALTY POINTS <Text>−₹{pointsToRedeem.toLocaleString('en-IN')}</Text></Text>}<View style={s.rule}/><Text style={s.total}>TOTAL <Text>₹{total.toLocaleString('en-IN')}</Text></Text></View>
  <Pressable accessibilityRole="button" disabled={busy||checking} onPress={place} style={[s.place,busy&&{opacity:.6}]}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.placeText}>PLACE ORDER  →</Text>}</Pressable><Text style={s.trust}>SECURE CHECKOUT  ·  VERIFIED PAYMENTS  ·  EASY ONLINE SUPPORT</Text>
 </ScrollView>;
}
function Section({title,children}:{title:string;children:any}){return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>}
function Input({label,value,onChangeText,keyboardType,wide}:{label:string;value:string;onChangeText:(v:string)=>void;keyboardType?:any;wide?:boolean}){return <View style={[s.inputWrap,wide&&{flex:1}]}><Text style={s.inputLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} keyboardType={keyboardType} style={s.input}/></View>}
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:'#f7f7f5',padding:22,paddingTop:58},
 center:{flex:1,justifyContent:'center',alignItems:'center',padding:24,backgroundColor:'#f7f7f5'},
 eyebrow:{fontSize:9,color:'#777',letterSpacing:2,fontWeight:'800'},
 title:{fontSize:42,fontWeight:'900',letterSpacing:-2,marginTop:5,color:'#111'},
 progress:{flexDirection:'row',alignItems:'center',marginTop:22,marginBottom:2},
 progressStep:{alignItems:'center',gap:5},
 progressNumber:{fontSize:10,fontWeight:'900',color:'#111',borderWidth:1,borderColor:'#111',borderRadius:20,width:25,height:25,textAlign:'center',textAlignVertical:'center'},
 progressLabel:{fontSize:8,fontWeight:'900',letterSpacing:.8,color:'#555'},
 progressLine:{height:1,backgroundColor:'#ccc',flex:1,marginHorizontal:9,marginBottom:13},
 section:{marginTop:24,backgroundColor:'#fff',padding:16,borderRadius:4,borderWidth:1,borderColor:'#ececea'},
 sectionTitle:{fontSize:10,fontWeight:'900',letterSpacing:1.4,marginBottom:15,color:'#111'},
 saved:{width:250,borderWidth:1,borderColor:'#ddd',padding:14,borderRadius:3,backgroundColor:'#fafafa'},
 savedTitle:{fontSize:9,fontWeight:'900',letterSpacing:.8,color:'#111'},
 savedText:{fontSize:10,color:'#666',marginTop:5,lineHeight:15},
 emptySaved:{fontSize:11,color:'#777'},
 inputWrap:{marginBottom:12},
 inputLabel:{fontSize:9,color:'#666',marginBottom:6,fontWeight:'700',letterSpacing:.3},
 input:{borderWidth:1,borderColor:'#e1e1df',backgroundColor:'#fafaf9',padding:13,fontSize:12,color:'#111',borderRadius:3},
 two:{flexDirection:'row',gap:10},
 deliveryCheck:{borderWidth:1,borderColor:'#111',padding:13,alignItems:'center',justifyContent:'center',borderRadius:3,marginTop:2},
 deliveryCheckText:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#111'},
 deliveryStatus:{fontSize:10,lineHeight:16,marginTop:9},
 ok:{color:'#18794e'},
 bad:{color:'#b42318'},
 reviewItem:{flexDirection:'row',justifyContent:'space-between',gap:15,borderTopWidth:1,borderTopColor:'#eee',paddingVertical:14},
 reviewDetails:{flex:1},
 reviewName:{fontSize:12,fontWeight:'800',color:'#111'},
 reviewVariant:{fontSize:10,color:'#666',marginTop:4},
 reviewUnit:{fontSize:9,color:'#888',marginTop:4},
 reviewTotal:{fontSize:12,fontWeight:'900',color:'#111'},
 reviewNote:{fontSize:10,color:'#777',lineHeight:16,marginTop:7},
 coupon:{flexDirection:'row',borderWidth:1,borderColor:'#ddd',borderRadius:3,overflow:'hidden'},
 couponInput:{flex:1,padding:13,fontSize:11,color:'#111',backgroundColor:'#fafaf9'},
 apply:{backgroundColor:'#111',paddingHorizontal:19,justifyContent:'center'},
 applyText:{color:'#fff',fontSize:9,fontWeight:'900',letterSpacing:.6},
 loyaltyCard:{borderWidth:1,borderColor:'#e5e5e3',padding:14,marginBottom:11,backgroundColor:'#fafaf9',borderRadius:3},
 loyaltyBalance:{fontSize:11,fontWeight:'900',letterSpacing:.7,color:'#111'},
 loyaltyHint:{fontSize:10,color:'#777',lineHeight:15,marginTop:6},
 msg:{fontSize:10,marginTop:9},
 paymentRow:{gap:10},
 payment:{borderWidth:1,borderColor:'#ddd',padding:15,borderRadius:3,backgroundColor:'#fafaf9'},
 paymentActive:{borderColor:'#111',backgroundColor:'#f0f0ed'},
 paymentText:{fontSize:9,fontWeight:'900',letterSpacing:.7,color:'#666'},
 paymentTextActive:{color:'#111'},
 summary:{borderWidth:1,borderColor:'#e5e5e3',backgroundColor:'#fff',marginTop:20,padding:18,borderRadius:3},
 sumLine:{fontSize:11,color:'#666',marginBottom:9,flexDirection:'row',justifyContent:'space-between'},
 rule:{height:1,backgroundColor:'#ddd',marginVertical:11},
 total:{fontSize:18,fontWeight:'900',color:'#111'},
 place:{backgroundColor:'#111',padding:19,alignItems:'center',marginTop:15,borderRadius:3,minHeight:54,justifyContent:'center'},
 placeText:{color:'#fff',fontSize:10,fontWeight:'900',letterSpacing:1.2},
 trust:{fontSize:8,color:'#777',letterSpacing:.7,textAlign:'center',marginTop:14,marginBottom:18},
 btn:{backgroundColor:'#111',padding:16,marginTop:18,borderRadius:3},
 btnText:{color:'#fff',fontWeight:'900'},
 note:{color:'#777',marginTop:8}
});
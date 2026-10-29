import React,{memo,useCallback,useEffect,useState} from 'react';
import {View,Text,Image,Pressable,StyleSheet,Alert,ActivityIndicator} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useStore} from '../store/store';
import {theme} from '../theme';

const money=(v:any)=>`₹${Number(v||0).toLocaleString('en-IN')}`;
const FALLBACK_IMAGE='https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80';

function stockState(p:any):boolean|null{
 const quantity=p.stock_quantity??p.inventory??p.stockCount??p.stock;
 if(typeof quantity==='number'&&Number.isFinite(quantity))return quantity>0;
 if(typeof quantity==='string'&&quantity.trim()!==''&&Number.isFinite(Number(quantity)))return Number(quantity)>0;
 for(const key of ['in_stock','is_available','available','stock'])if(typeof p[key]==='boolean')return p[key];
 return null;
}

function ProductCard({p}:{p:any}){
 const r=useRouter();
 const imageUri=p.image||p.images?.[0]||FALLBACK_IMAGE;
 const [imageFailed,setImageFailed]=useState(false);
 const [imageLoading,setImageLoading]=useState(true);
 const [wishBusy,setWishBusy]=useState(false);
 useEffect(()=>{setImageFailed(false);setImageLoading(true)},[imageUri]);
 const {wishlist,toggleWish,add}=useStore();
 const liked=wishlist.some((value:any)=>String(typeof value==='object'?(value?.id??value?.product_id):value)===String(p.id));
 const rawPrice=Number(p.price);const price=Number.isFinite(rawPrice)&&rawPrice>=0?rawPrice:0;
 const rawOldPrice=Number(p.old_price??p.compare_at_price);const oldPrice=Number.isFinite(rawOldPrice)&&rawOldPrice>0?rawOldPrice:0;
 const discount=oldPrice>price&&price>0?Math.round(((oldPrice-price)/oldPrice)*100):0;
 const available=stockState(p);
 const sizes=Array.isArray(p.sizes)?p.sizes:Array.isArray(p.variants)?p.variants.map((v:any)=>v?.size).filter(Boolean):[];
 const hasColourVariants=(Array.isArray(p.colors)&&p.colors.length>0)||(Array.isArray(p.variants)&&p.variants.some((v:any)=>Boolean(v?.color??v?.colour)));
 const openProduct=useCallback(()=>r.push(`/product/${p.id}` as any),[p.id,r]);
 const quickAdd=useCallback(async()=>{if(sizes.length||hasColourVariants||available===null){openProduct();return;}if(!available)return;try{await add(p);}catch{openProduct();}},[sizes.length,hasColourVariants,available,openProduct,add,p]);
 const toggleWishlist=useCallback(async(event:any)=>{event?.stopPropagation?.();if(wishBusy||p.id==null)return;setWishBusy(true);try{await toggleWish(Number(p.id));}catch(error:any){Alert.alert('Wishlist not updated',error?.message||'Please check your connection and try again.');}finally{setWishBusy(false);}},[wishBusy,p.id,toggleWish]);
 return <View style={s.card}>
  <Pressable accessibilityRole="button" accessibilityLabel={`View ${p.name||'product'}`} onPress={openProduct} style={({pressed})=>[s.productPress,pressed&&s.pressed]}>
   <View style={s.media}>
    {imageLoading&&!imageFailed&&<View style={s.imageLoader}><ActivityIndicator size="small" color={theme.colors.muted}/></View>}
    <Image source={{uri:imageFailed?FALLBACK_IMAGE:imageUri}} onLoadStart={()=>setImageLoading(true)} onLoad={()=>setImageLoading(false)} onError={()=>{setImageFailed(true);setImageLoading(false)}} fadeDuration={180} style={s.img} resizeMode="cover"/>
    <View style={s.badge}><Text style={s.badgeText}>{discount>0?`-${discount}%`:'NEW'}</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel={wishBusy?'Updating wishlist':liked?'Remove from wishlist':'Add to wishlist'} accessibilityState={{disabled:wishBusy,busy:wishBusy,selected:liked}} disabled={wishBusy} hitSlop={8} style={({pressed})=>[s.heart,pressed&&s.heartPressed]} onPress={toggleWishlist}><Ionicons name={liked?'heart':'heart-outline'} size={18} color={theme.colors.ink}/></Pressable>
    {available===false&&<View style={s.sold}><Text style={s.soldText}>SOLD OUT</Text></View>}
   </View>
   <Text style={s.cat} numberOfLines={1}>{p.category||'THE OFF GRID'}</Text>
   <Text style={s.name} numberOfLines={2}>{p.name||'Untitled product'}</Text>
   <View style={s.priceRow}><Text style={s.price}>{money(price)}</Text>{discount>0&&<Text style={s.oldPrice}>{money(oldPrice)}</Text>}{discount>0&&<Text style={s.off}>{discount}% OFF</Text>}</View>
  </Pressable>
  <Pressable accessibilityRole="button" accessibilityLabel={`${available===false?'Sold out':sizes.length||hasColourVariants?'Choose product options for':available===null?'View details for':'Quick add'} ${p.name||'product'}`} style={({pressed})=>[s.add,available===false&&s.disabled,pressed&&available!==false&&s.addPressed]} onPress={quickAdd} disabled={available===false}><Ionicons name={available===false?'close-circle-outline':sizes.length||hasColourVariants?'options-outline':'add-outline'} size={15} color={available===false?theme.colors.subtle:theme.colors.ink}/><Text style={[s.addText,available===false&&s.disabledText]}>{available===false?'SOLD OUT':sizes.length||hasColourVariants?'CHOOSE OPTIONS':available===null?'VIEW DETAILS':'QUICK ADD'}</Text></Pressable>
 </View>;
}

const sameProductCardProps=(prev:{p:any},next:{p:any})=>{
 const a=prev.p,b=next.p;
 if(a===b)return true;
 if(!a||!b)return false;
 const keys=['id','name','category','price','old_price','compare_at_price','image','stock_quantity','inventory','stockCount','stock','in_stock','is_available','available'];
 return keys.every(key=>a[key]===b[key])&&
  JSON.stringify(a.images||[])===JSON.stringify(b.images||[])&&
  JSON.stringify(a.sizes||[])===JSON.stringify(b.sizes||[])&&
  JSON.stringify(a.colors||[])===JSON.stringify(b.colors||[])&&
  JSON.stringify(a.variants||[])===JSON.stringify(b.variants||[]);
};
export default memo(ProductCard,sameProductCardProps);

const s=StyleSheet.create({
 card:{width:'48%',marginBottom:30},productPress:{opacity:1},pressed:{opacity:.92},
 media:{position:'relative',backgroundColor:theme.colors.surfaceStrong,borderRadius:theme.radius.sm,overflow:'hidden',aspectRatio:.78},img:{width:'100%',height:'100%',backgroundColor:theme.colors.surfaceStrong},imageLoader:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center',zIndex:0},
 heart:{position:'absolute',right:10,top:10,width:38,height:38,borderRadius:theme.radius.pill,backgroundColor:'rgba(255,255,255,.96)',alignItems:'center',justifyContent:'center'},heartPressed:{transform:[{scale:.92}],backgroundColor:'#eee'},
 badge:{position:'absolute',left:10,top:10,backgroundColor:theme.colors.ink,paddingHorizontal:8,paddingVertical:6},badgeText:{color:theme.colors.inverse,fontSize:8,fontWeight:'900',letterSpacing:1.1},
 sold:{position:'absolute',bottom:0,left:0,right:0,paddingVertical:9,backgroundColor:'rgba(17,17,17,.94)'},soldText:{color:theme.colors.inverse,fontSize:9,fontWeight:'900',textAlign:'center',letterSpacing:1.2},
 cat:{fontSize:8,letterSpacing:1.2,color:theme.colors.muted,marginTop:10,textTransform:'uppercase'},name:{fontSize:13,fontWeight:'700',lineHeight:18,marginTop:4,minHeight:36,color:theme.colors.ink},
 priceRow:{flexDirection:'row',alignItems:'baseline',flexWrap:'wrap',gap:6,marginTop:5},price:{fontSize:13,fontWeight:'900',color:theme.colors.ink},oldPrice:{fontSize:11,color:theme.colors.subtle,textDecorationLine:'line-through'},off:{fontSize:9,fontWeight:'800',color:theme.colors.success,letterSpacing:.4},
 add:{borderWidth:1,borderColor:theme.colors.ink,paddingVertical:11,marginTop:11,alignItems:'center',justifyContent:'center',minHeight:42,flexDirection:'row',gap:5,borderRadius:theme.radius.sm},addPressed:{backgroundColor:theme.colors.ink},disabled:{borderColor:theme.colors.line,backgroundColor:theme.colors.surface},addText:{fontSize:9,fontWeight:'900',letterSpacing:1},disabledText:{color:theme.colors.subtle},
});

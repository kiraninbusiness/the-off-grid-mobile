import AsyncStorage from '@react-native-async-storage/async-storage';

const PRODUCTION_API_URL = 'https://the-off-grid-api.onrender.com/api';
export const API_URL = (__DEV__ && process.env.EXPO_PUBLIC_API_URL ? process.env.EXPO_PUBLIC_API_URL : PRODUCTION_API_URL).replace(/\/$/, '');
export async function getToken(){ return AsyncStorage.getItem('offgrid_token'); }
export function listFrom<T=any>(value:any, keys:string[]=['items','products','data','results']) : T[] { if(Array.isArray(value)) return value as T[]; for(const key of keys) if(Array.isArray(value?.[key])) return value[key] as T[]; return []; }
// Offline catalogue: successful GETs for browsing data are kept on the device and served if the network fails.
const CACHEABLE=/^\/(products(\/\d+)?(\?.*)?|banners)$/;
const isCacheable=(path:string,options:RequestInit)=>(!options.method||options.method==='GET')&&CACHEABLE.test(path);
const cacheKey=(path:string)=>`offgrid_cache:${path}`;
function cacheSave(path:string,raw:string){if(raw.length>400000)return;AsyncStorage.setItem(cacheKey(path),raw).catch(()=>{})}
async function cacheLoad(path:string){try{const raw=await AsyncStorage.getItem(cacheKey(path));return raw?JSON.parse(raw):null}catch{return null}}
export async function request<T=any>(path:string, options:RequestInit={}){ const token=await getToken(); const headers:any={Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{}),...(options.headers||{})}; if(token) headers.Authorization=`Bearer ${token}`; const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),15000); try{const res=await fetch(`${API_URL}${path}`,{...options,headers,signal:controller.signal}); const raw=await res.text(); if(res.ok&&isCacheable(path,options))cacheSave(path,raw); let data:any={}; try{data=raw?JSON.parse(raw):{}}catch{data={message:raw.slice(0,180)}} if(!res.ok){const err:any=new Error(data?.message||data?.error||`Request failed (${res.status})`);err.status=res.status;throw err} return data as T;}catch(e:any){if((e instanceof TypeError&&/fetch|network|failed/i.test(String(e.message)))||e?.name==='AbortError'){if(isCacheable(path,options)){const hit=await cacheLoad(path);if(hit!==null)return hit as T}}if(e?.name==='AbortError')throw new Error('The server took too long to respond. Please try again.');if(e instanceof TypeError&&/fetch|network|failed/i.test(String(e.message)))throw new Error('Unable to reach The Off Grid server. Check your internet connection and try again.');throw e;}finally{clearTimeout(timer)} }
export async function uploadReviewPhoto(uri:string, mime?:string){
 const token=await getToken(); const type=mime&&/^image\//.test(mime)?mime:'image/jpeg'; const ext=type.split('/')[1]||'jpg';
 const form=new FormData(); form.append('file',{uri,name:`review.${ext}`,type} as any);
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),45000);
 try{const res=await fetch(`${API_URL}/upload/review-photo`,{method:'POST',headers:{Accept:'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:form,signal:controller.signal});
  const raw=await res.text(); let data:any={}; try{data=raw?JSON.parse(raw):{}}catch{}
  if(!res.ok) throw new Error(data?.message||`Upload failed (${res.status})`);
  return String(data.url||'');
 }catch(e:any){ if(e?.name==='AbortError') throw new Error('Photo upload took too long. Please try again.'); throw e; }
 finally{clearTimeout(timer)} }

export async function visualProductSearch(uri:string, mime?:string){
 const token=await getToken();
 const type=mime&&/^image\//.test(mime)?mime:'image/jpeg';
 const ext=type.split('/')[1]||'jpg';
 const form=new FormData();
 form.append('file',{uri,name:`visual-search.${ext}`,type} as any);
 const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),35000);
 try{
  const res=await fetch(`${API_URL}/visual-search`,{method:'POST',headers:{Accept:'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:form,signal:controller.signal});
  const raw=await res.text();let data:any={};try{data=raw?JSON.parse(raw):{}}catch{}
  if(!res.ok){const error:any=new Error(data?.message||`Visual search failed (${res.status})`);error.status=res.status;throw error;}
  return data;
 }catch(e:any){if(e?.name==='AbortError')throw new Error('Visual search took too long. Please try again.');throw e;}
 finally{clearTimeout(timer);}
}

export const api={
 products:(query='')=>request<any>(`/products${query}`), product:(id:string|number)=>request<any>(`/products/${id}`),
 banners:()=>request<any>('/banners'), publicOffers:()=>request<any>('/coupons/public'), otpRequest:(phone:string)=>request<any>('/auth/otp/request',{method:'POST',body:JSON.stringify({phone})}), otpVerify:(body:{phone:string;code:string;name?:string;email?:string})=>request<any>('/auth/otp/verify',{method:'POST',body:JSON.stringify(body)}), login:(email:string,password:string)=>request<any>('/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
 register:(name:string,email:string,password:string,referral_code?:string)=>request<any>('/auth/register',{method:'POST',body:JSON.stringify({name,email,password,referral_code})}), me:()=>request<any>('/auth/me'),
 cart:()=>request<any[]>('/cart'), mergeCart:(items:any[],requestId:string)=>request<any[]>('/cart/merge',{method:'POST',body:JSON.stringify({items,request_id:requestId})}), cartItem:(item:any,mode:'set'|'increment'='set')=>request<any>('/cart/item',{method:'PUT',body:JSON.stringify({...item,mode})}), registerPushToken:(token:string,platform:string)=>request<any>('/notifications/push-token',{method:'POST',body:JSON.stringify({token,platform})}), removeCart:(id:number)=>request<any>(`/cart/item/${id}`,{method:'DELETE'}), clearCart:()=>request<any>('/cart',{method:'DELETE'}),
 wishlist:()=>request<number[]>('/cart/wishlist'), mergeWishlist:(ids:number[])=>request<number[]>('/cart/wishlist/merge',{method:'POST',body:JSON.stringify({ids})}), addWishlist:(id:number)=>request<any>(`/cart/wishlist/${id}`,{method:'PUT'}), removeWishlist:(id:number)=>request<any>(`/cart/wishlist/${id}`,{method:'DELETE'}),
 addresses:()=>request<any>('/profile/addresses'), addAddress:(body:any)=>request<any>('/profile/addresses',{method:'POST',body:JSON.stringify(body)}), updateAddress:(id:number|string,body:any)=>request<any>(`/profile/addresses/${id}`,{method:'PATCH',body:JSON.stringify(body)}), deleteAddress:(id:number|string)=>request<any>(`/profile/addresses/${id}`,{method:'DELETE'}), setDefaultAddress:(id:number|string)=>request<any>(`/profile/addresses/${id}/default`,{method:'POST'}), forgotPassword:(email:string)=>request<any>('/auth/forgot-password',{method:'POST',body:JSON.stringify({email})}), deleteAccount:(password:string)=>request<any>('/auth/me',{method:'DELETE',body:JSON.stringify({password})}), orders:()=>request<any>('/orders/mine'), order:(id:number|string)=>request<any>(`/orders/${id}`), cancelOrder:(id:number|string)=>request<any>(`/orders/${id}/cancel`,{method:'PATCH'}), cancelPayment:(id:number|string)=>request<any>(`/orders/${id}/payment-cancel`,{method:'PATCH'}),
 validateCoupon:(code:string,subtotal:number)=>request<any>('/coupons/validate',{method:'POST',body:JSON.stringify({code,subtotal})}), createOrder:(body:any,idempotencyKey?:string)=>request<any>('/orders/create',{method:'POST',body:JSON.stringify(body),...(idempotencyKey?{headers:{'Idempotency-Key':idempotencyKey}}:{})}), verifyPayment:(body:any)=>request<any>('/orders/verify-payment',{method:'POST',body:JSON.stringify(body)}),
 reviews:(productId:string|number)=>request<any>(`/reviews/${productId}`), submitReview:(productId:string|number,body:any)=>request<any>(`/reviews/${productId}`,{method:'POST',body:JSON.stringify(body)}),
 notifications:()=>request<any[]>('/notifications'), unreadNotifications:()=>request<any>('/notifications/unread-count'), readNotification:(id:number)=>request<any>(`/notifications/${id}/read`,{method:'PATCH'}), readAllNotifications:()=>request<any>('/notifications/read-all',{method:'PATCH'}),
 newsletterSubscribe:(email:string)=>request<any>('/newsletter',{method:'POST',body:JSON.stringify({email})}),
 combos:()=>request<any[]>('/combos'), giftCardAmounts:()=>request<number[]>('/gift-cards/amounts'), purchaseGiftCard:(body:any)=>request<any>('/gift-cards/purchase',{method:'POST',body:JSON.stringify(body)}), verifyGiftCard:(body:any)=>request<any>('/gift-cards/verify-payment',{method:'POST',body:JSON.stringify(body)}), giftCards:()=>request<any[]>('/gift-cards/mine'),
 returns:()=>request<any[]>('/returns/mine'), createReturn:(body:any)=>request<any>('/returns',{method:'POST',body:JSON.stringify(body)}),
 creatorApplication:()=>request<any>('/creators/me'), applyCreator:(body:any)=>request<any>('/creators/apply',{method:'POST',body:JSON.stringify(body)}), customerLoyalty:()=>request<any>('/customer/loyalty'), customerReferrals:()=>request<any>('/customer/referrals'), community:(sort:'new'|'trending'='new')=>request<any[]>(`/community?sort=${sort}`), myCommunity:()=>request<any[]>('/community/mine'), shareOutfit:(image:string,caption:string)=>request<any>('/community',{method:'POST',body:JSON.stringify({image,caption})}), likeOutfit:(id:number)=>request<any>(`/community/${id}/like`,{method:'POST'}), unlikeOutfit:(id:number)=>request<any>(`/community/${id}/like`,{method:'DELETE'}), giftIdeas:(budget:number,who:string)=>request<any[]>(`/customer/gift-ideas?budget=${budget}&for=${who}`), looks:()=>request<any[]>('/looks'), look:(id:string|number)=>request<any>(`/looks/${id}`), customerClub:()=>request<any>('/customer/club'), setBirthday:(birthday:string)=>request<any>('/customer/birthday',{method:'PUT',body:JSON.stringify({birthday})}), recommendations:(productId?:string|number)=>request<any[]>(`/customer/recommendations${productId?`?product_id=${productId}`:''}`), subscribeStockAlert:(body:any)=>request<any>('/customer/stock-alerts',{method:'POST',body:JSON.stringify(body)}), serviceability:(pincode:string)=>request<any>(`/customer/serviceability/${encodeURIComponent(pincode)}`), submitSupport:(body:any)=>request<any>('/contact',{method:'POST',body:JSON.stringify(body)}), profileUpdate:(body:any)=>request<any>('/auth/me',{method:'PATCH',body:JSON.stringify(body)}),
};

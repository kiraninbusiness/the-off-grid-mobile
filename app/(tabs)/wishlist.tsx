import React,{useCallback,useRef,useState} from 'react';
import {View,Text,ScrollView,StyleSheet,ActivityIndicator,Pressable} from 'react-native';
import {useFocusEffect} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import ProductCard from '../../src/components/ProductCard';
import {api,listFrom} from '../../src/lib/api';
import {useStore} from '../../src/store/store';

export default function Wishlist(){
 const {wishlist}=useStore();
 const [products,setProducts]=useState<any[]>([]);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const router=useRouter();
 const requestId=useRef(0);
 const load=useCallback(()=>{const id=++requestId.current;setLoading(true);setError('');api.products().then(x=>{if(id===requestId.current)setProducts(listFrom(x))}).catch((e:any)=>{if(id===requestId.current)setError(e?.message||'Unable to load saved pieces.')}).finally(()=>{if(id===requestId.current)setLoading(false)});return()=>{if(requestId.current===id)requestId.current++}},[]);
 useFocusEffect(useCallback(()=>load(),[load]));
 const saved=new Set(wishlist.map((id:any)=>String(typeof id==='object'?(id.id??id.product_id):id)));
 const items=products.filter(p=>saved.has(String(p.id)));
 return <ScrollView style={s.page} contentContainerStyle={s.content}>
  <Text style={s.eyebrow}>YOUR PERSONAL EDIT</Text><Text style={s.title}>WISHLIST</Text><Text style={s.subtitle}>Pieces worth keeping close.</Text>
  {loading?<ActivityIndicator style={{marginTop:45}} color="#111"/>:error?<View style={s.empty}><Ionicons name="cloud-offline-outline" size={30} color="#777"/><Text style={s.emptyTitle}>Your saved pieces couldn’t load</Text><Text style={s.emptyCopy}>{error}</Text><Pressable style={s.button} onPress={load}><Text style={s.buttonText}>TRY AGAIN</Text></Pressable></View>:items.length?<><View style={s.meta}><Text style={s.count}>{items.length} SAVED PIECE{items.length===1?'':'S'}</Text><Text style={s.hint}>Tap a heart to remove a piece.</Text></View><View style={s.grid}>{items.map(p=><ProductCard key={p.id} p={p}/>)}</View></>:<View style={s.empty}><Ionicons name="heart-outline" size={34} color="#777"/><Text style={s.emptyTitle}>Your next favourite goes here.</Text><Text style={s.emptyCopy}>Save pieces from the collection and they’ll be waiting for you here.</Text><Pressable style={s.button} onPress={()=>router.push('/(tabs)/shop')}><Text style={s.buttonText}>EXPLORE THE COLLECTION</Text></Pressable></View>}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#fff'},content:{padding:22,paddingTop:55,paddingBottom:40},eyebrow:{fontSize:8,color:'#777',letterSpacing:1.5},title:{fontSize:42,fontWeight:'900',letterSpacing:-2,marginTop:7},subtitle:{fontSize:12,color:'#777',marginTop:4},meta:{marginTop:25,marginBottom:12},count:{fontSize:9,fontWeight:'900',letterSpacing:1},hint:{fontSize:10,color:'#777',marginTop:5},grid:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between',marginTop:18},empty:{alignItems:'center',paddingHorizontal:18,paddingVertical:55,gap:11},emptyTitle:{fontSize:16,fontWeight:'800',textAlign:'center'},emptyCopy:{fontSize:12,color:'#777',textAlign:'center',lineHeight:18},button:{borderWidth:1,borderColor:'#111',paddingHorizontal:18,paddingVertical:14,marginTop:7},buttonText:{fontSize:9,fontWeight:'900',letterSpacing:1}});

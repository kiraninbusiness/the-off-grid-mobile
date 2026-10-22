import React,{useEffect,useState} from 'react';
import {ScrollView,View,Text,StyleSheet,Pressable,TextInput,Alert,ActivityIndicator} from 'react-native';
import {useLocalSearchParams,useRouter} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {api} from '../../../src/lib/api';

export default function Reviews(){
 const {id}=useLocalSearchParams<{id:string}>(); const r=useRouter();
 const [data,setData]=useState<any>(null),[rating,setRating]=useState(5),[comment,setComment]=useState(''),[busy,setBusy]=useState(false);
 const load=()=>api.reviews(id).then(setData).catch(()=>setData({reviews:[],summary:{count:0,average:0}}));
 useEffect(()=>{load()},[id]);
 const submit=async()=>{if(!comment.trim())return Alert.alert('Add a review','Tell us what you liked about the product.');setBusy(true);try{await api.submitReview(id,{rating,comment});setComment('');await load();Alert.alert('Review submitted','Thanks for sharing your experience.')}catch(e:any){Alert.alert('Unable to submit',e.message||'Please sign in and try again.')}finally{setBusy(false)}};
 return <ScrollView style={s.page} contentContainerStyle={{paddingBottom:50}}>
  <Pressable style={s.back} onPress={()=>r.back()}><Ionicons name="arrow-back" size={19}/><Text style={s.backText}>BACK</Text></Pressable>
  <Text style={s.eyebrow}>THE OFF GRID / COMMUNITY</Text><Text style={s.title}>REVIEWS</Text>
  {!data?<ActivityIndicator style={{marginTop:30}}/>:<><View style={s.summary}><Text style={s.avg}>{Number(data.summary?.average||0).toFixed(1)}</Text><Text style={s.stars}>{'★'.repeat(Math.round(Number(data.summary?.average||0)))}{'☆'.repeat(5-Math.round(Number(data.summary?.average||0)))}</Text><Text style={s.count}>{data.summary?.count||0} REVIEWS</Text></View>
  <View style={s.write}><Text style={s.label}>YOUR RATING</Text><View style={s.starRow}>{[1,2,3,4,5].map(x=><Pressable key={x} onPress={()=>setRating(x)}><Text style={s.bigStar}>{x<=rating?'★':'☆'}</Text></Pressable>)}</View><Text style={s.label}>YOUR REVIEW</Text><TextInput multiline value={comment} onChangeText={setComment} placeholder="How was the fit, quality and feel?" style={s.input}/><Pressable disabled={busy} style={s.btn} onPress={submit}>{busy?<ActivityIndicator color="#fff"/>:<Text style={s.btnText}>SUBMIT REVIEW</Text>}</Pressable></View>
  {(data.reviews||[]).map((x:any)=><View key={x.id} style={s.review}><View style={s.reviewHead}><Text style={s.user}>{x.user_name||'OFF GRID MEMBER'}</Text><Text style={s.reviewStars}>{'★'.repeat(Number(x.rating||0))}</Text></View><Text style={s.comment}>{x.comment}</Text><Text style={s.date}>{x.created_at?new Date(x.created_at).toLocaleDateString('en-IN'):''}{x.verified_purchase?' · VERIFIED PURCHASE':''}</Text></View>)}</>}
 </ScrollView>
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#fff',padding:22},back:{height:48,flexDirection:'row',alignItems:'center',gap:8},backText:{fontSize:9,fontWeight:'900',letterSpacing:1},eyebrow:{fontSize:9,color:'#777',letterSpacing:1.5},title:{fontSize:42,fontWeight:'900',letterSpacing:-2,marginTop:4},summary:{marginTop:20,borderTopWidth:1,borderBottomWidth:1,borderColor:'#ddd',paddingVertical:22,alignItems:'center'},avg:{fontSize:40,fontWeight:'900'},stars:{fontSize:20,letterSpacing:2},count:{fontSize:8,color:'#777',letterSpacing:1.2,marginTop:6},write:{marginTop:25},label:{fontSize:9,fontWeight:'900',letterSpacing:1.3,marginBottom:10},starRow:{flexDirection:'row',gap:7,marginBottom:18},bigStar:{fontSize:30},input:{minHeight:110,borderWidth:1,borderColor:'#ccc',padding:13,textAlignVertical:'top',fontSize:13},btn:{backgroundColor:'#111',padding:17,alignItems:'center',marginTop:10},btnText:{color:'#fff',fontSize:10,fontWeight:'900',letterSpacing:1},review:{borderTopWidth:1,borderTopColor:'#eee',paddingVertical:18},reviewHead:{flexDirection:'row',justifyContent:'space-between'},user:{fontSize:10,fontWeight:'900',letterSpacing:1},reviewStars:{fontSize:12},comment:{fontSize:13,color:'#444',lineHeight:20,marginTop:8},date:{fontSize:8,color:'#999',marginTop:8}});

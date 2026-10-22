import {useState} from 'react';
import {View,Text,Pressable,StyleSheet,Dimensions} from 'react-native';
import {router} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {track} from '../src/lib/analytics';
const W=Dimensions.get('window').width;
const slides=[
 {eyebrow:'THE OFF GRID',title:'WEAR\nOUTSIDE THE ORDINARY',body:'Discover limited drops, everyday essentials and pieces designed to stand apart.'},
 {eyebrow:'CURATED DROPS',title:'FIND IT.\nSAVE IT. OWN IT.',body:'Save your favourites, explore new arrivals and get closer to every limited release.'},
 {eyebrow:'READY WHEN YOU ARE',title:'SHOP\nYOUR WAY',body:'Fast checkout, order updates and a seamless experience built around The Off Grid.'}
];
export default function Onboarding(){const [i,setI]=useState(0);const s=slides[i];const finish=async()=>{await AsyncStorage.setItem('offgrid_onboarded','1');track('onboarding_completed');router.replace('/(tabs)')};return <View style={styles.root}><View style={styles.top}><Text style={styles.logo}>THE OFF GRID</Text><Text style={styles.count}>{i+1}/{slides.length}</Text></View><View style={styles.copy}><Text style={styles.eyebrow}>{s.eyebrow}</Text><Text style={styles.title}>{s.title}</Text><Text style={styles.body}>{s.body}</Text></View><View style={styles.bottom}>{i<slides.length-1?<Pressable style={styles.button} onPress={()=>{setI(i+1);track('onboarding_slide',{slide:i+2})}}><Text style={styles.buttonText}>CONTINUE</Text></Pressable>:<Pressable style={styles.button} onPress={finish}><Text style={styles.buttonText}>ENTER THE OFF GRID</Text></Pressable>}<Pressable onPress={finish} style={styles.skip}><Text style={styles.skipText}>{i<slides.length-1?'SKIP':'START SHOPPING'}</Text></Pressable></View></View>}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#0a0a0a',padding:24},top:{paddingTop:48,flexDirection:'row',justifyContent:'space-between'},logo:{color:'#fff',fontWeight:'900',letterSpacing:2,fontSize:15},count:{color:'#777',fontWeight:'700'},copy:{flex:1,justifyContent:'center',maxWidth:W-48},eyebrow:{color:'#888',fontWeight:'800',letterSpacing:2,fontSize:11,marginBottom:20},title:{color:'#fff',fontSize:42,lineHeight:44,fontWeight:'900',letterSpacing:-1},body:{color:'#aaa',fontSize:16,lineHeight:25,marginTop:24,maxWidth:340},bottom:{paddingBottom:28},button:{height:56,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},buttonText:{fontWeight:'900',letterSpacing:1},skip:{alignItems:'center',padding:18},skipText:{color:'#888',fontSize:11,fontWeight:'800',letterSpacing:1}});

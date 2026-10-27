import React,{useMemo,useState} from 'react';
import {Alert,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRouter} from 'expo-router';

const questions=[
 {key:'style',title:'WHAT BEST DESCRIBES YOUR STYLE?',options:['MINIMAL','STREETWEAR','SMART CASUAL','OVERSIZED','ATHLEISURE','CLASSIC']},
 {key:'fit',title:'YOUR GO-TO FIT?',options:['SLIM','REGULAR','RELAXED','OVERSIZED']},
 {key:'palette',title:'YOUR COLOUR PALETTE?',options:['BLACK / WHITE','EARTH TONES','NAVY / BLUE','NEUTRALS','BOLD COLOURS']},
 {key:'occasion',title:'WHAT DO YOU SHOP FOR MOST?',options:['EVERYDAY','COLLEGE / CAMPUS','WORK','WEEKEND','NIGHT OUT']},
];

export default function StyleQuiz(){
 const r=useRouter(); const [step,setStep]=useState(0); const [answers,setAnswers]=useState<Record<string,string>>({}); const q=questions[step];
 const progress=useMemo(()=>`${step+1} / ${questions.length}`,[step]);
 const choose=async(value:string)=>{const next={...answers,[q.key]:value};setAnswers(next);if(step<questions.length-1){setStep(step+1);return;}await AsyncStorage.setItem('offgrid_style_profile',JSON.stringify(next));Alert.alert('STYLE PROFILE READY','Your preferences are saved. We will use them to personalize your Off Grid discovery experience.',[{text:'EXPLORE MY STYLE',onPress:()=>r.replace('/stylist' as any)}]);};
 return <ScrollView style={s.page} contentContainerStyle={s.content}><Text style={s.eyebrow}>THE OFF GRID / PERSONAL STYLE</Text><Text style={s.title}>STYLE QUIZ</Text><View style={s.progress}><View style={[s.progressFill,{width:`${((step+1)/questions.length)*100}%`}]} /></View><Text style={s.count}>{progress}</Text><Text style={s.question}>{q.title}</Text><Text style={s.sub}>Choose one. You can update your preferences anytime.</Text>{q.options.map(option=><Pressable key={option} accessibilityRole="button" accessibilityState={{selected:answers[q.key]===option}} onPress={()=>choose(option)} style={[s.option,answers[q.key]===option&&s.selected]}><Text style={[s.optionText,answers[q.key]===option&&s.selectedText]}>{option}</Text><Text style={s.arrow}>→</Text></Pressable>)}{step>0&&<Pressable accessibilityRole="button" onPress={()=>setStep(step-1)} style={s.back}><Text style={s.backText}>← BACK</Text></Pressable>}</ScrollView>;
}
const s=StyleSheet.create({page:{flex:1,backgroundColor:'#fff'},content:{padding:24,paddingTop:58,paddingBottom:50},eyebrow:{fontSize:9,letterSpacing:1.5,color:'#777'},title:{fontSize:40,fontWeight:'900',letterSpacing:-2,color:'#111',marginTop:4},progress:{height:3,backgroundColor:'#eee',marginTop:25},progressFill:{height:3,backgroundColor:'#111'},count:{fontSize:9,fontWeight:'800',letterSpacing:1,color:'#777',marginTop:10},question:{fontSize:25,fontWeight:'900',letterSpacing:-.8,color:'#111',marginTop:45},sub:{fontSize:12,lineHeight:19,color:'#777',marginTop:8,marginBottom:22},option:{minHeight:58,borderWidth:1,borderColor:'#ddd',paddingHorizontal:18,marginBottom:10,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},selected:{backgroundColor:'#111',borderColor:'#111'},optionText:{fontSize:11,fontWeight:'900',letterSpacing:1,color:'#222'},selectedText:{color:'#fff'},arrow:{fontSize:18,color:'#777'},back:{alignSelf:'center',padding:18,marginTop:8},backText:{fontSize:9,fontWeight:'900',letterSpacing:1,color:'#555'}});

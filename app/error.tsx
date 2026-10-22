import {View, Text, Pressable, StyleSheet} from 'react-native';
import {router} from 'expo-router';

export default function ErrorScreen({error, retry}: {error: Error; retry: () => void}) {
  return <View style={styles.root}>
    <Text style={styles.logo}>THE OFF GRID</Text>
    <Text style={styles.title}>Something went off grid.</Text>
    <Text style={styles.body}>{error?.message || 'Please try again.'}</Text>
    <Pressable style={styles.button} onPress={retry}><Text style={styles.buttonText}>TRY AGAIN</Text></Pressable>
    <Pressable style={styles.link} onPress={() => router.replace('/(tabs)')}><Text style={styles.linkText}>BACK TO SHOP</Text></Pressable>
  </View>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#0a0a0a',padding:28,justifyContent:'center'},logo:{color:'#fff',fontWeight:'900',letterSpacing:2,fontSize:14,marginBottom:30},title:{color:'#fff',fontSize:32,fontWeight:'900',lineHeight:36},body:{color:'#999',fontSize:15,lineHeight:23,marginTop:16,marginBottom:28},button:{height:54,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},buttonText:{fontWeight:'900',letterSpacing:1},link:{alignItems:'center',padding:18},linkText:{color:'#888',fontWeight:'800',letterSpacing:1,fontSize:11}});

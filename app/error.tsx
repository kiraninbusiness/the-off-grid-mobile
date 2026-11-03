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
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#0a0a0a',padding:28,justifyContent:'center'},logo:{color:'#0A0A0A',fontFamily:'SpaceGrotesk-Bold',letterSpacing:2,fontSize:14,marginBottom:30},title:{color:'#0A0A0A',fontSize:32,fontFamily:'SpaceGrotesk-Bold',lineHeight:36},body:{color:'#8A877F',fontSize:15,fontFamily:'DMSans-Regular',lineHeight:23,marginTop:16,marginBottom:28},button:{height:54,backgroundColor:'#0A0A0A',alignItems:'center',justifyContent:'center'},buttonText:{fontFamily:'SpaceGrotesk-Bold',letterSpacing:1},link:{alignItems:'center',padding:18},linkText:{color:'#8F8C85',fontFamily:'SpaceGrotesk-Bold',letterSpacing:1,fontSize:11}});

import React, { useEffect } from 'react';
import { Image, StyleSheet, View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useStorage } from '@/hooks/useStorage';
import  useBiometrics  from '@/hooks/useBiometrics';

const { width, height } = Dimensions.get('window');

const authIndex = () => {
  const router = useRouter();
  const [ hasLoggedIn ] = useStorage('hasLoggedInBefore', false);
  const { isLoading, attemptBiometricLogin } = useBiometrics();

  const sendToRegister = () => {
    router.push('/(auth)/register');
  };

  const sendToLogin = () => {
    router.push('/(auth)/login');
  };

  const loginPress = () => {
    attemptBiometricLogin(true);
  }
  
  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/images/logo_trans_default.png')}
        style={styles.logo}
        resizeMode='contain'
      />
      {isLoading ? (
        <View style={styles.content}>
            <ActivityIndicator size='large' color={theme.colours.blue50} />
        </View>
      ) : (
      <>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>
            {hasLoggedIn ? 'Welcome back' : 'Welcome'}
          </Text>
        </View>
        <View style={styles.bottomContent}>
        {hasLoggedIn ? (
          <TouchableOpacity style={styles.button} onPress={loginPress}>
            <Text style={styles.buttonText}>Log in</Text>
          </TouchableOpacity>
        
        ) : (<>
          <TouchableOpacity style={styles.button} onPress={sendToRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendToLogin}>
            <Text style={styles.linkText}>Already have an account?</Text>
          </TouchableOpacity>
        </>)}
        </View>
      </>)}
    </View>
  )
}

const styles = StyleSheet.create({
    welcomeText: {
      fontFamily: "Roboto_500Medium",
      fontSize: 80,
      color: "#000000",
      textAlign: 'center',
    },
    container: {
      flex: 1,
      backgroundColor: theme.colours.blue99,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    bottomContent: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: height * 0.02,
    },
    logo: {
      width: width * 0.7,
      height: width * 0.7,
      marginBottom: height * 0.05,
      marginTop: height * 0.12,
      alignSelf: 'center',
    },
    button: {
      backgroundColor: theme.colours.buttonBlue,
      paddingBottom: 14,
      paddingTop: 10,
      borderRadius: 30,
      marginBottom: 20,
      width: width * 0.9,
      alignItems: 'center',
    },
    buttonText: {
      color: theme.colours.white,
      fontSize: 30,
      fontFamily: theme.fonts.openSans.semiBold,
    },
    linkText: {
      color: theme.colours.black,
      fontSize: 20,
      fontFamily: theme.fonts.openSans.regular,
    }
});

export default authIndex; 
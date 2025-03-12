import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import * as SecureStorage from 'expo-secure-store';
import { useAuth } from '@/context/auth';
import { ScrollView, View, Dimensions, Text, StyleSheet, TextInput, Image, ActivityIndicator, TouchableOpacity, Alert} from 'react-native';
import  InputField from '@/components/InputField';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const { loading, authenticateToken } = useAuth();

    const doLogin = async () => {
        if (loading) return;
        const emailValid = validate.email(email);

        if (!email || !password) {
            Alert.alert('Please enter your email and password');
            return;
        }

        if (emailValid) {
            Alert.alert(emailValid);
            return;
        }
    };

    const sendToForgot = () => {
        router.push('/(auth)/forgot');
    }

    const validate = {
        email: (value:string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) return 'Email is required';
            if (!emailRegex.test(value)) return 'Please enter a valid email';
            return '';
        },
    
        password: (value:string) => {
            if (!value) return 'Password is required';
            if (value.length < 8) return 'Password must be at least 8 characters';
            return '';
        },
    };

    useEffect(() => {
        SecureStorage.getItemAsync('auth:email').then((value) => {
            if (value){
                setEmail(value);
            }
        });

    }, []);

    return (
        <ScrollView contentContainerStyle={{flexGrow: 1}}>
            <View style={styles.container}>
                <Image 
                    source={require('@/assets/images/logo_trans_icon.png')}
                    style={styles.logo}
                    resizeMode='contain'
                />
                <Text style={styles.titleText}>
                    Log in
                </Text>
                <View style={styles.content}>
                    <InputField 
                        label='Email'
                        value={email}
                        placeholder='Type email'
                        onChangeText={setEmail}
                        keyboardType='email-address'
                        autoComplete='email'
                        validateOnBlur
                        validate={validate.email}
                        style={{
                            input: styles.input,
                            label: styles.inputLabel,
                            errorText: styles.errorText,
                            container: styles.inputContainer,
                            errorInput: styles.errorInput,
                        }}
                    />
                    <InputField 
                        label='Password'
                        value={password}
                        placeholder='Type password'
                        onChangeText={setPassword}
                        secureTextEntry
                        validateOnBlur
                        autoComplete='current-password'
                        validate={validate.password}
                        style={{
                            input: styles.input,
                            label: styles.inputLabel,
                            errorText: styles.errorText,
                            container: styles.inputContainer,
                            errorInput: styles.errorInput,
                        }}
                    />
                    <TouchableOpacity style={styles.linkButton} onPress={sendToForgot}>
                        <Text style={styles.linkText}>Forgot your password?</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.bottomContent}>
                    <TouchableOpacity style={styles.button} onPress={doLogin}>
                        {loading ? (
                            <ActivityIndicator size='large' color={theme.colours.blue50} />
                        ) :(
                            <Text style={styles.buttonText}>Continue</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    titleText: {
      fontFamily: theme.fonts.roboto.medium,
      fontSize: 80,
      color: "#000000",
      textAlign: 'center',
      marginBottom: height * 0.05,
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
      width: width * 0.4,
      height: width * 0.4,
      marginBottom: height * 0.02,
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
    linkButton: { 
        alignSelf: 'flex-start', 
        marginTop: -16, 
        marginBottom: 20 
    },
    linkText: {
      color: theme.colours.black,
      fontSize: 20,
      fontFamily: theme.fonts.openSans.regular,
    },
    input: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        fontSize: 30,
        fontFamily: theme.fonts.openSans.regular,
    },
    inputLabel: {
        fontFamily: theme.fonts.openSans.regular,
        alignSelf: 'flex-start',
        fontSize: 30,
        marginBottom: 10,
    },
    inputContainer: {
        marginBottom: 20,
        width: '100%',
    },
    errorInput: {
        borderColor: theme.colours.primary,
        borderWidth: 3,
    },
    errorText: {
        color: theme.colours.primary,
        fontSize: 20,
        fontFamily: theme.fonts.openSans.regular,
    },
});

export default LoginScreen;
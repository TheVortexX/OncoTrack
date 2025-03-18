import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ScrollView, View, Dimensions, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert, KeyboardAvoidingView, Platform} from 'react-native';
import InputField from '@/components/InputField';

const { width, height } = Dimensions.get('window');

const ForgotPassScreen = () => {
    const [email, setEmail] = useState('');
    const router = useRouter();
    const { loading } = useAuth(); // TODO FORGOT PASSWORD

    const doForgot = async () => {
        Alert.alert('Password reset email sent', 'Please check your email for a link to reset your password.');
        router.push('/(auth)');
    };

    const validate = {
        email: (value: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) return 'Email is required';
            if (!emailRegex.test(value)) return 'Please enter a valid email';
            return '';
        },
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>
                    <Image
                        source={require('@/assets/images/logo_trans_icon.png')}
                        style={styles.logo}
                        resizeMode='contain'
                    />
                    <Text style={styles.titleText}>
                        Forgot Password
                    </Text>
                    <View style={styles.content}>
                        <InputField
                            label='Email'
                            value={email}
                            placeholder='Enter your email'
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
                        <Text style={styles.linkText}>
                            A link to reset your password will be sent to your email.
                        </Text>
                    </View>
                    <View style={styles.bottomContent}>
                        <TouchableOpacity style={styles.button} onPress={doForgot}>
                            {loading ? (
                                <ActivityIndicator size='large' color={theme.colours.blue50} />
                            ) : (
                                <Text style={styles.buttonText}>Reset password</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
    linkText: {
        color: theme.colours.black,
        fontSize: 25,
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

export default ForgotPassScreen;
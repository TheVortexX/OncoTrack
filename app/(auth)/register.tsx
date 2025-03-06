import React, { useState } from 'react';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { useRouter } from 'expo-router';
import { ScrollView, View, Dimensions, Text, StyleSheet, TextInput, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import InputField from '../../components/InputField';
import CheckBox from 'expo-checkbox';

const { width, height } = Dimensions.get('window');

const RegistrationScreen = () => {
    const [fName, setFName] = useState('');
    const [lName, setLName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confPassword, setConfPassword] = useState('');
    const [tosChecked, setTosChecked] = useState(false);
    const [privacyChecked, setPrivacyChecked] = useState(false);
    const { loading, authenticateToken } = useAuth();

    const router = useRouter();

    const doRegister = async () => {
        if (loading) return;
        if (validate.email(email)) {Alert.alert(validate.email(email)); return;}
        if (validate.password(password)) {Alert.alert(validate.password(password)); return;}
        if (validate.passMatch(confPassword)) {Alert.alert(validate.passMatch(confPassword)); return;}
        if (validate.notEmptyTextOnly(fName)) {Alert.alert(validate.notEmptyTextOnly(fName)); return;}
        if (validate.notEmptyTextOnly(lName)) {Alert.alert(validate.notEmptyTextOnly(lName)); return;}
    };

    const validate = {
        email: (value: string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!value) return 'Email is required';
            if (!emailRegex.test(value)) return 'Please enter a valid email';
            return '';
        },

        password: (value: string) => {
            if (!value) return 'Password is required';
            if (value.length < 8) return 'Password must be at least 8 characters';
            if (!/[A-Z]/.test(value)) return 'Password must contain at least one upper case character';
            if (!/[a-z]/.test(value)) return 'Password must contain at least one lower case character';
            if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
            return '';
        },

        passMatch: (value: string) => {
            if (!value) return 'Password confirmation is required';
            if (value !== password) return 'Passwords do not match';
            return '';
        },

        notEmptyTextOnly: (value: string) => {
            if (!value) return 'Field is required';
            if (value === '' || value === ' ') return 'Field cannot be blank';
            if (!/^[A-Za-z\- ]+$/.test(value)) return 'Field can contain only letters, hyphens, and spaces';
            return '';
        },
    };
    
    const toTOS = () => {
        Alert.alert('Terms of Service', 'This is where the terms of service would be displayed');
    }

    const toPrivacy = () => {
        Alert.alert('Privacy Policy', 'This is where the privacy policy would be displayed');
    }


    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>
                <Image
                    source={require('../../assets/images/logo_trans_icon.png')}
                    style={styles.logo}
                    resizeMode='contain'
                />
                <Text style={styles.titleText}>Register</Text>
                <View style={styles.content}>
                    <InputField
                        label='First Name'
                        value={fName}
                        placeholder='Type your first name'
                        onChangeText={setFName}
                        autoComplete='given-name'
                        autoCapitalize='words'
                        validateOnBlur
                        validate={validate.notEmptyTextOnly}
                        style={{
                            input: styles.input,
                            label: styles.inputLabel,
                            errorText: styles.errorText,
                            container: styles.inputContainer,
                            errorInput: styles.errorInput,
                        }}
                    />
                    <InputField
                        label='Last Name'
                        value={lName}
                        placeholder='Type your last name'
                        onChangeText={setLName}
                        autoComplete='family-name'
                        autoCapitalize='words'
                        validateOnBlur
                        validate={validate.notEmptyTextOnly}
                        style={{
                            input: styles.input,
                            label: styles.inputLabel,
                            errorText: styles.errorText,
                            container: styles.inputContainer,
                            errorInput: styles.errorInput,
                        }}
                    />
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
                        autoComplete='new-password'
                        validate={validate.password}
                        style={{
                            input: styles.input,
                            label: styles.inputLabel,
                            errorText: styles.errorText,
                            container: styles.inputContainer,
                            errorInput: styles.errorInput,
                        }}
                    />
                    <InputField
                        label='Confirm password'
                        value={confPassword}
                        placeholder='Re-enter your password'
                        onChangeText={setConfPassword}
                        secureTextEntry
                        validateOnBlur
                        autoComplete='new-password'
                        validate={validate.passMatch}
                        style={{
                            input: styles.input,
                            label: styles.inputLabel,
                            errorText: styles.errorText,
                            container: styles.inputContainer,
                            errorInput: styles.errorInput,
                        }}
                    />
                    <View style={styles.checkboxContainer}>
                        <CheckBox
                            value={tosChecked}
                            onValueChange={setTosChecked}
                            style={styles.checkbox}
                            color={tosChecked ? theme.colours.primary : undefined}
                        />
                        <Text style={styles.checkboxText}>I agree to the </Text><TouchableOpacity onPress={toTOS}><Text style={[styles.checkboxText, { textDecorationLine: "underline" }]}>Terms of Service</Text></TouchableOpacity>
                    </View>
                    <View style={styles.checkboxContainer}>
                        <CheckBox
                            value={privacyChecked}
                            onValueChange={setPrivacyChecked}
                            style={styles.checkbox}
                            color={privacyChecked ? theme.colours.primary : undefined}
                        />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.checkboxText}>
                                I confirm that I agree to OncoTrack's{' '}
                                <Text
                                    onPress={toPrivacy}
                                    style={[styles.checkboxText, { textDecorationLine: "underline" }]}
                                >
                                    Privacy Policy
                                </Text>
                            </Text>
                        </View>
                    </View>
                </View>
                <View style={styles.bottomContent}>
                    <TouchableOpacity style={styles.button} onPress={doRegister}>
                        {loading ? (
                            <ActivityIndicator size='large' color={theme.colours.blue50} />
                        ) : (
                            <Text style={styles.buttonText}>Create account</Text>
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
        justifyContent: 'center', // Center vertically
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 40
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
    checkboxContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
        paddingHorizontal: 2,
        paddingVertical: 20,
    },
    checkbox: {
        width: 50,
        height: 50,
        borderRadius: 5,
        marginRight: 20,
    },

    checkboxText: {
        fontSize: 20,
        fontFamily: theme.fonts.openSans.regular,
    },
});

export default RegistrationScreen;
import React, { useState } from 'react';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import { ScrollView, View, Dimensions, Text, StyleSheet, TextInput, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import InputField from '@/components/InputField';
import CheckBox from 'expo-checkbox';
import validate from '@/utils/fieldValidation';
import { updateUserProfile } from '@/services/profileService';


const { width, height } = Dimensions.get('window');


// Gender, cancer type, age
const DetailsScreen = () => {
    const [cancerType, setCancerType] = useState('');
    const [birthday, setBirthday] = useState('');
    const [sex, setSex] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const doContinue = async () => {
        setLoading(true);
        try {
            if (user){
                await updateUserProfile(user.uid, {
                    cancerType,
                    birthday,
                    sex,
                    registrationStage: 'complete',
                });
                router.replace('/(tabs)');
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            Alert.alert('Error updating profile', 'An error occurred while updating your profile. Please try again later.');
        } finally {
            setLoading(false);
        }        
    }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.container}>
                <Image
                    source={require('@/assets/images/logo_trans_icon.png')}
                    style={styles.logo}
                    resizeMode='contain'
                />
                <Text style={styles.titleText}>Your details</Text>
                <View style={styles.content}>
                    <InputField
                        label='Type of cancer'
                        value={cancerType}
                        placeholder='Select type(s) of cancer'
                        onChangeText={setCancerType}
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
                        label='Select date of birth'
                        value={birthday}
                        placeholder='Select date of birth'
                        onChangeText={setBirthday}
                        autoComplete='birthdate-full'
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
                        label='Sex'
                        value={sex}
                        placeholder='Select sex'
                        onChangeText={setSex}
                        autoComplete='gender'
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
                </View>
                <View style={styles.bottomContent}>
                    <TouchableOpacity style={styles.button} onPress={doContinue}>
                        {loading ? (
                            <ActivityIndicator size='large' color={theme.colours.blue50} />
                        ) : (
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
    passwordHint: {
        fontSize: 20,
        fontFamily: theme.fonts.openSans.regular,
        marginBottom: 10,
    },
    passwordHintList: {
        fontSize: 20,
        fontFamily: theme.fonts.openSans.regular,
        marginLeft: 10,
    },
    passwordRequirementRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
});

export default DetailsScreen;
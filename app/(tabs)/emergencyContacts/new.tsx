import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import InputField from '@/components/InputField';
import validate from '@/utils/fieldValidation';
import { useEmergencyContacts } from '@/context/emergencyContacts';
import Header from '@/components/header';

const { width, height } = Dimensions.get('window');

const AddContactScreen = () => {
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const { addContact } = useEmergencyContacts();

    const saveContact = async () => {
        if (loading) return;

        if (validate.notEmptyTextOnly(name)) {
            Alert.alert('Error', 'Please enter a contact name');
            return;
        }

        if (validate.phone(phoneNumber)) {
            Alert.alert('Error', validate.phone(phoneNumber));
            return;
        }

        setLoading(true);
        try {
            const success = await addContact({
                name,
                number: phoneNumber,
                description,
            })

            if (success) {
                Alert.alert(
                    'Success',
                    'Contact saved successfully',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('Error', 'Failed to save contact. Please try again.');
            }
        } catch (error) {
            console.error('Error saving contact:', error);
            Alert.alert('Error', 'Failed to save contact. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.container}>
                    <Header 
                        title='Add Emergency Contact'
                        subtitle='Add a new emergency contact'
                        colour={theme.colours.primary}
                        leftButtonType='back'
                    />

                    <View style={styles.content}>
                        <InputField
                            label="Name"
                            value={name}
                            placeholder="Enter contact name"
                            onChangeText={setName}
                            autoCapitalize="words"
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
                            label="Phone Number"
                            value={phoneNumber}
                            placeholder="Enter phone number"
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            validateOnBlur
                            validate={validate.phone}
                            style={{
                                input: styles.input,
                                label: styles.inputLabel,
                                errorText: styles.errorText,
                                container: styles.inputContainer,
                                errorInput: styles.errorInput,
                            }}
                        />

                        <InputField
                            label="Description"
                            value={description}
                            placeholder="e.g. Oncologist, Family, ..."
                            onChangeText={setDescription}
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
                        <TouchableOpacity
                            style={[styles.button, loading && styles.disabledButton]}
                            onPress={saveContact}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Saving...' : 'Save Contact'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
        marginBottom: 70,
    },
    content: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    bottomContent: {
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: height * 0.05,
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
    multilineInput: {
        height: 120,
        textAlignVertical: 'top',
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
    button: {
        backgroundColor: theme.colours.buttonBlue,
        paddingBottom: 14,
        paddingTop: 10,
        borderRadius: 30,
        marginBottom: 20,
        width: width * 0.9,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: theme.colours.paleBlue,
    },
    buttonText: {
        color: theme.colours.white,
        fontSize: 30,
        fontFamily: theme.fonts.openSans.semiBold,
    },
});

export default AddContactScreen;
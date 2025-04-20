import React, { useState } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';
import {
    ScrollView,
    View,
    Dimensions,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import InputField from '@/components/InputField';
import validate from '@/utils/fieldValidation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import PickerModal from '@/components/iosPicker';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

const DetailsScreen = () => {
    const [cancerType, setCancerType] = useState('');
    const [birthday, setBirthday] = useState('');
    const [formattedBirthday, setFormattedBirthday] = useState('');
    const [birthdayDate, setBirthdayDate] = useState(new Date());
    const [sex, setSex] = useState('');
    const [loading, setLoading] = useState(false);
    const { user, updateProfile } = useAuth();
    const router = useRouter();

    // State for showing/hiding date picker for Android
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSexPicker, setShowSexPicker] = useState(false);

    const sexOptions = [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
        { label: 'Prefer not to say', value: 'Prefer not to say' }
    ];

    const handleDateChange = (event:any, selectedDate: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (!selectedDate) return;

        const currentDate = selectedDate || birthdayDate;
        setBirthdayDate(currentDate);

        const formattedDate = moment(currentDate).format('DD MMM, YYYY');
        setFormattedBirthday(formattedDate);
        setBirthday(moment(currentDate).format('YYYY-MM-DD')); // ISO format for storage
    };

    const doContinue = async () => {
        if (!cancerType.trim()) {
            Alert.alert('Missing Information', 'Please enter your cancer type.');
            return;
        }

        if (!birthday.trim()) {
            Alert.alert('Missing Information', 'Please select your date of birth.');
            return;
        }

        if (!sex.trim()) {
            Alert.alert('Missing Information', 'Please select your sex.');
            return;
        }

        setLoading(true);
        try {
            if (user) {
                await updateProfile({
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

    // Platform-specific picker rendering for sex
    const renderSexPicker = () => {
        if (Platform.OS === 'ios') {
            return (
                <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setShowSexPicker(true)}
                >
                    <Text style={styles.pickerButtonText}>
                        {sex || 'Select sex'}
                    </Text>

                    <PickerModal
                        isVisible={showSexPicker}
                        onClose={() => setShowSexPicker(false)}
                        onConfirm={(value) => setSex(value)}
                        value={sex}
                        items={sexOptions}
                        title="Select Sex"
                    />
                </TouchableOpacity>
            );
        } else {
            return (
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={sex}
                        onValueChange={(itemValue) => setSex(itemValue)}
                        style={styles.picker}
                        mode="dropdown"
                    >
                        <Picker.Item label="Select sex" value="" />
                        {sexOptions.map((option) => (
                            <Picker.Item
                                key={option.value}
                                label={option.label}
                                value={option.value}
                            />
                        ))}
                    </Picker>
                </View>
            );
        }
    };

    // Render date picker based on platform
    const renderDatePicker = () => {
        if (Platform.OS === 'ios') {
            // iOS - Render inline DateTimePicker
            return (
                <View style={styles.datePickerWrapper}>
                    <DateTimePicker
                        value={birthdayDate}
                        mode="date"
                        display="default"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        textColor={theme.colours.textPrimary}
                        themeVariant="light"
                        style={{ marginLeft: -10 }}
                    />
                </View>
            );
        } else {
            // Android - Use a button to show the picker
            return (
                <>
                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.datePickerButtonText}>
                            {formattedBirthday || 'Select date of birth'}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={birthdayDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                        />
                    )}
                </>
            );
        }
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

                        {/* Date of Birth Picker */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Date of birth</Text>
                            {renderDatePicker()}
                        </View>

                        {/* Sex Picker */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Sex</Text>
                            {renderSexPicker()}
                        </View>
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
        </KeyboardAvoidingView>
    );
};

const shadowStyle = Platform.select({
    ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    android: {
        elevation: 2,
    },
});

const styles = StyleSheet.create({
    titleText: {
        fontFamily: theme.fonts.roboto.medium,
        fontSize: normaliseSize(80),
        color: "#000000",
        textAlign: 'center',
        marginBottom: height * 0.05,
    },
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
        justifyContent: 'center',
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
        fontSize: normaliseSize(30),
        fontFamily: theme.fonts.openSans.semiBold,
    },
    linkButton: {
        alignSelf: 'flex-start',
        marginTop: -16,
        marginBottom: 20
    },
    linkText: {
        color: theme.colours.black,
        fontSize: normaliseSize(20),
        fontFamily: theme.fonts.openSans.regular,
    },
    input: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        fontSize: normaliseSize(30),
        fontFamily: theme.fonts.openSans.regular,
    },
    inputLabel: {
        fontFamily: theme.fonts.openSans.regular,
        alignSelf: 'flex-start',
        fontSize: normaliseSize(30),
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
        fontSize: normaliseSize(20),
        fontFamily: theme.fonts.openSans.regular,
    },
    // Date picker styles
    datePickerWrapper: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
        borderRadius: 6,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        ...shadowStyle,
    },
    datePickerButton: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        ...shadowStyle,
    },
    datePickerButtonText: {
        fontSize: normaliseSize(30),
        fontFamily: theme.fonts.openSans.regular,
        color: '#000000',
    },
    // Sex picker styles
    pickerButton: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
        borderRadius: 6,
        paddingHorizontal: 10,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
    },
    pickerButtonText: {
        fontSize: normaliseSize(30),
        fontFamily: theme.fonts.openSans.regular,
        color: '#000000',
    },
    pickerContainer: {
        width: '100%',
        height: 60,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
        borderRadius: 6,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    picker: {
        width: '100%',
        height: 60,
        fontSize: normaliseSize(30),
    },
});

export default DetailsScreen;
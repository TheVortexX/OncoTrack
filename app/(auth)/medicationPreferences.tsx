import React, { useState, useEffect, useCallback } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    TouchableOpacity,
    ScrollView,
    Alert,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { createUserMedicationSettings, updateSetting } from '@/services/profileService';
import { useAuth } from '@/context/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import moment from 'moment';

const { width, height } = Dimensions.get('window');

// Define types for time picker parameters
type TimeType = 'morning' | 'afternoon' | 'evening';
type IconName = 'weather-sunny' | 'weather-partly-cloudy' | 'weather-night';

const MedicationSettingsScreen = () => {
    const { user, updateProfile } = useAuth();
    const router = useRouter();

    const [morningTime, setMorningTime] = useState('08:00');
    const [afternoonTime, setAfternoonTime] = useState('12:00');
    const [eveningTime, setEveningTime] = useState('18:00');

    const [showMorningPicker, setShowMorningPicker] = useState(false);
    const [showAfternoonPicker, setShowAfternoonPicker] = useState(false);
    const [showEveningPicker, setShowEveningPicker] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchMedicationSettings = async () => {
        if (!user?.uid) return;

        setIsLoading(true);
        try {
            const settingsDoc = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'medications'));

            if (settingsDoc.exists()) {
                const data = settingsDoc.data();
                setMorningTime(data.morningTime || '08:00');
                setAfternoonTime(data.afternoonTime || '12:00');
                setEveningTime(data.eveningTime || '18:00');
            } else {
                createUserMedicationSettings(user.uid)
            }
        } catch (error) {
            console.error('Error fetching medication settings:', error);
            Alert.alert('Error', 'Failed to load medication settings');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchMedicationSettings();
            }
        }, [user])
    );

    const handleSaveSettings = async () => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }
        
        setSaving(true);
        try {
            await updateProfile({
                registrationStage: 'complete',
            });
            const morningSuccess = await updateSetting(user.uid, 'medications', 'morningTime', morningTime);
            const afternoonSuccess = await updateSetting(user.uid, 'medications', 'afternoonTime', afternoonTime);
            const eveningSuccess = await updateSetting(user.uid, 'medications', 'eveningTime', eveningTime);

            if (morningSuccess && afternoonSuccess && eveningSuccess) {
                Alert.alert('Success', 'Medication times updated successfully');
            } else {
                Alert.alert('Error', 'Failed to update medication times');
            }
        } catch (error) {
            console.error('Error saving medication settings:', error);
            Alert.alert('Error', 'An error occurred while saving settings');
        } finally {
            setSaving(false);
        }
        router.replace('/(tabs)');
    };

    const handleTimeChange = (
        event: any,
        selectedTime: Date | undefined,
        timeType: TimeType
    ) => {
        if (Platform.OS === 'android') {
            setShowMorningPicker(false);
            setShowAfternoonPicker(false);
            setShowEveningPicker(false);
        }

        if (!selectedTime) return;

        const timeString = moment(selectedTime).format('HH:mm');

        switch (timeType) {
            case 'morning':
                setMorningTime(timeString);
                break;
            case 'afternoon':
                setAfternoonTime(timeString);
                break;
            case 'evening':
                setEveningTime(timeString);
                break;
        }
    };

    const formatTimeForDisplay = (timeString: string): string => {
        return moment(timeString, 'HH:mm').format('h:mm A');
    };

    const renderTimePicker = (
        timeType: TimeType,
        timeValue: string,
        showPicker: boolean,
        setShowPicker: React.Dispatch<React.SetStateAction<boolean>>,
        label: string,
        icon: IconName
    ) => {
        if (Platform.OS === 'ios') {
            return (
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                        <MaterialCommunityIcons name={icon} size={24} color={theme.colours.primary} style={styles.timeIcon} />
                        {' '}{label}
                    </Text>
                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowPicker(!showPicker)}
                    >
                        <Text style={styles.datePickerButtonText}>
                            {formatTimeForDisplay(timeValue)}
                        </Text>
                    </TouchableOpacity>

                    {showPicker && (
                        <View style={styles.inlineDatePickerContainer}>
                            <DateTimePicker
                                value={moment(timeValue, 'HH:mm').toDate()}
                                mode="time"
                                display="spinner"
                                onChange={(event, date) => handleTimeChange(event, date, timeType)}
                                textColor={theme.colours.textPrimary}
                                themeVariant="light"
                                style={styles.datePicker}
                            />
                            <View style={styles.pickerButtonContainer}>
                                <TouchableOpacity
                                    style={styles.pickerActionButton}
                                    onPress={() => setShowPicker(false)}
                                >
                                    <Text style={styles.pickerActionButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.pickerActionButton, styles.confirmButton]}
                                    onPress={() => {
                                        handleTimeChange(null, moment(timeValue, 'HH:mm').toDate(), timeType);
                                        setShowPicker(false);
                                    }}
                                >
                                    <Text style={[styles.pickerActionButtonText, styles.confirmButtonText]}>Confirm</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            );
        } else {
            return (
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                        <MaterialCommunityIcons name={icon} size={24} color={theme.colours.primary} style={styles.timeIcon} />
                        {' '}{label}
                    </Text>
                    <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={() => setShowPicker(true)}
                    >
                        <Text style={styles.datePickerButtonText}>
                            {formatTimeForDisplay(timeValue)}
                        </Text>
                    </TouchableOpacity>

                    {showPicker && (
                        <DateTimePicker
                            value={moment(timeValue, 'HH:mm').toDate()}
                            mode="time"
                            display="default"
                            onChange={(event, date) => handleTimeChange(event, date, timeType)}
                        />
                    )}
                </View>
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
                    <Text style={styles.titleText}>Medication Times</Text>
                    <Text style={styles.subtitleText}>Set your preferred medication reminder times</Text>

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colours.buttonBlue} />
                            <Text style={styles.loadingText}>Loading your settings...</Text>
                        </View>
                    ) : (
                        <View style={styles.content}>
                            {renderTimePicker(
                                'morning',
                                morningTime,
                                showMorningPicker,
                                setShowMorningPicker,
                                'Morning',
                                'weather-sunny'
                            )}

                            {renderTimePicker(
                                'afternoon',
                                afternoonTime,
                                showAfternoonPicker,
                                setShowAfternoonPicker,
                                'Afternoon',
                                'weather-partly-cloudy'
                            )}

                            {renderTimePicker(
                                'evening',
                                eveningTime,
                                showEveningPicker,
                                setShowEveningPicker,
                                'Evening',
                                'weather-night'
                            )}
                        </View>
                    )}

                    <View style={styles.bottomContent}>
                        <TouchableOpacity style={styles.button} onPress={handleSaveSettings} disabled={isLoading || saving}>
                            {saving ? (
                                <ActivityIndicator size='large' color={theme.colours.blue50} />
                            ) : (
                                <Text style={styles.buttonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.helperText}>
                            These times will be used for medication reminders and can be changed later from your account settings.
                        </Text>
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
        marginBottom: height * 0.01,
    },
    subtitleText: {
        fontFamily: theme.fonts.openSans.regular,
        fontSize: normaliseSize(30),
        color: theme.colours.textSecondary,
        textAlign: 'center',
        marginBottom: height * 0.05,
        paddingHorizontal: 10,
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: normaliseSize(30),
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
        marginTop: 10,
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
    inputContainer: {
        marginBottom: 20,
        width: '100%',
    },
    inputLabel: {
        fontFamily: theme.fonts.openSans.regular,
        alignSelf: 'flex-start',
        fontSize: normaliseSize(30),
        marginBottom: 10,
    },
    timeIcon: {
        marginRight: 8,
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
    helperText: {
        fontSize: normaliseSize(20),
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    inlineDatePickerContainer: {
        marginTop: 8,
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
        padding: 15,
        ...shadowStyle,
    },
    datePicker: {
        height: 200,
    },
    pickerButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    pickerActionButton: {
        padding: 10,
        width: '48%',
        alignItems: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colours.gray20,
    },
    pickerActionButtonText: {
        fontSize: normaliseSize(28),
        fontFamily: theme.fonts.openSans.regular,
        color: theme.colours.textPrimary,
    },
    confirmButton: {
        backgroundColor: theme.colours.buttonBlue,
        borderColor: theme.colours.buttonBlue,
    },
    confirmButtonText: {
        color: theme.colours.white,
        fontFamily: theme.fonts.openSans.semiBold,
    },
});

export default MedicationSettingsScreen;
import React, { useState, useEffect, useCallback } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { createUserMedicationSettings, updateSetting } from '@/services/profileService';
import { useAuth } from '@/context/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import moment from 'moment';
import Header from '@/components/header';

const MedicationSettingsScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [morningTime, setMorningTime] = useState('08:00');
    const [afternoonTime, setAfternoonTime] = useState('12:00');
    const [eveningTime, setEveningTime] = useState('18:00');

    const [showMorningPicker, setShowMorningPicker] = useState(false);
    const [showAfternoonPicker, setShowAfternoonPicker] = useState(false);
    const [showEveningPicker, setShowEveningPicker] = useState(false);

    const [isLoading, setIsLoading] = useState(true);

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

        try {
            const morningSuccess = await updateSetting(user.uid, 'medications', 'morningTime', morningTime);
            const afternoonSuccess = await updateSetting(user.uid, 'medications', 'afternoonTime', afternoonTime);
            const eveningSuccess = await updateSetting(user.uid, 'medications', 'eveningTime', eveningTime);

            if (morningSuccess && afternoonSuccess && eveningSuccess) {
                Alert.alert('Success', 'Medication times updated successfully');
                router.back();
            } else {
                Alert.alert('Error', 'Failed to update medication times');
            }
        } catch (error) {
            console.error('Error saving medication settings:', error);
            Alert.alert('Error', 'An error occurred while saving settings');
        }
    };

    const handleTimeChange = (event: any, selectedTime: Date | undefined, timeType: string) => {
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

    const formatTimeForDisplay = (timeString: string) => {
        return moment(timeString, 'HH:mm').format('h:mm A');
    };

    return (
        <>
            <View style={styles.container}>
                <Header 
                    title="Medication Times"
                    subtitle='Set your preferred medication reminder times'
                    leftButtonType='back'
                />

                <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading settings...</Text>
                        </View>
                    ) : (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Daily Reminder Times</Text>

                                {/* Morning time setting */}
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <View style={styles.timeLabel}>
                                            <MaterialCommunityIcons name="weather-sunny" size={24} color={theme.colours.primary} style={styles.timeIcon} />
                                            <Text style={styles.settingLabel}>Morning</Text>
                                        </View>
                                        <Text style={styles.settingValue}>{formatTimeForDisplay(morningTime)}</Text>
                                    </View>

                                    {Platform.OS === 'ios' ? (
                                        <View style={styles.timePickerContainer}>
                                            <DateTimePicker
                                                value={moment(morningTime, 'HH:mm').toDate()}
                                                mode="time"
                                                display="default"
                                                onChange={(event, date) => handleTimeChange(event, date, 'morning')}
                                                style={styles.iosTimePicker}
                                                textColor={theme.colours.textPrimary}
                                                themeVariant="light"
                                            />
                                        </View>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => setShowMorningPicker(true)}
                                                style={styles.actionButton}
                                            >
                                                <Text style={styles.actionButtonText}>Change</Text>
                                            </TouchableOpacity>

                                            {showMorningPicker && (
                                                <DateTimePicker
                                                    value={moment(morningTime, 'HH:mm').toDate()}
                                                    mode="time"
                                                    display="default"
                                                    onChange={(event, date) => handleTimeChange(event, date, 'morning')}
                                                />
                                            )}
                                        </>
                                    )}
                                </View>

                                {/* Afternoon time setting */}
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <View style={styles.timeLabel}>
                                            <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={theme.colours.primary} style={styles.timeIcon} />
                                            <Text style={styles.settingLabel}>Afternoon</Text>
                                        </View>
                                        <Text style={styles.settingValue}>{formatTimeForDisplay(afternoonTime)}</Text>
                                    </View>

                                    {Platform.OS === 'ios' ? (
                                        <View style={styles.timePickerContainer}>
                                            <DateTimePicker
                                                value={moment(afternoonTime, 'HH:mm').toDate()}
                                                mode="time"
                                                display="default"
                                                onChange={(event, date) => handleTimeChange(event, date, 'afternoon')}
                                                style={styles.iosTimePicker}
                                                textColor={theme.colours.textPrimary}
                                                themeVariant="light"
                                            />
                                        </View>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => setShowAfternoonPicker(true)}
                                                style={styles.actionButton}
                                            >
                                                <Text style={styles.actionButtonText}>Change</Text>
                                            </TouchableOpacity>

                                            {showAfternoonPicker && (
                                                <DateTimePicker
                                                    value={moment(afternoonTime, 'HH:mm').toDate()}
                                                    mode="time"
                                                    display="default"
                                                    onChange={(event, date) => handleTimeChange(event, date, 'afternoon')}
                                                />
                                            )}
                                        </>
                                    )}
                                </View>

                                {/* Evening time setting */}
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <View style={styles.timeLabel}>
                                            <MaterialCommunityIcons name="weather-night" size={24} color={theme.colours.primary} style={styles.timeIcon} />
                                            <Text style={styles.settingLabel}>Evening</Text>
                                        </View>
                                        <Text style={styles.settingValue}>{formatTimeForDisplay(eveningTime)}</Text>
                                    </View>

                                    {Platform.OS === 'ios' ? (
                                        <View style={styles.timePickerContainer}>
                                            <DateTimePicker
                                                value={moment(eveningTime, 'HH:mm').toDate()}
                                                mode="time"
                                                display="default"
                                                onChange={(event, date) => handleTimeChange(event, date, 'evening')}
                                                style={styles.iosTimePicker}
                                                textColor={theme.colours.textPrimary}
                                                themeVariant="light"
                                            />
                                        </View>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                onPress={() => setShowEveningPicker(true)}
                                                style={styles.actionButton}
                                            >
                                                <Text style={styles.actionButtonText}>Change</Text>
                                            </TouchableOpacity>

                                            {showEveningPicker && (
                                                <DateTimePicker
                                                    value={moment(eveningTime, 'HH:mm').toDate()}
                                                    mode="time"
                                                    display="default"
                                                    onChange={(event, date) => handleTimeChange(event, date, 'evening')}
                                                />
                                            )}
                                        </>
                                    )}
                                </View>
                            </View>

                            {/* Save button */}
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    These times will be used for medication reminders.
                                </Text>
                            </View>
                        </>
                    )}
                </ScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
        marginBottom: 70,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 100,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
    },
    section: {
        marginVertical: 12,
        marginHorizontal: 16,
        backgroundColor: theme.colours.surface,
        borderRadius: 12,
        shadowColor: theme.colours.blue0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: normaliseSize(18),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.blue20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    settingInfo: {
        flex: 1,
    },
    timeLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeIcon: {
        marginRight: 8,
    },
    settingLabel: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.textPrimary,
    },
    settingValue: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
        marginTop: 4,
        marginLeft: 32,
    },
    timePickerContainer: {
        width: 120,
    },
    iosTimePicker: {
        width: 120,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colours.primary,
    },
    actionButtonText: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.white,
    },
    saveButton: {
        marginHorizontal: 16,
        marginVertical: 20,
        backgroundColor: theme.colours.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.white,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.gray,
        textAlign: 'center',
    },
});

export default MedicationSettingsScreen;
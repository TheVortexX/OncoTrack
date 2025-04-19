import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { createUserNotificationSettings, updateSetting } from '@/services/profileService';
import { useAuth } from '@/context/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import Header from '@/components/header';

interface NotificationSettings {
    reminderTime: number;
    enabled: boolean;
}

const NotificationSettingsScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [reminderTime, setReminderTime] = useState<number>(60); 
    const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

    const [showReminderPicker, setShowReminderPicker] = useState<boolean>(false);

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchNotificationSettings = async (): Promise<void> => {
        if (!user?.uid) return;

        setIsLoading(true);
        try {
            const settingsDoc = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'notifications'));

            if (settingsDoc.exists()) {
                const data = settingsDoc.data() as NotificationSettings;
                setReminderTime(data.reminderTime ?? 60);
                setNotificationsEnabled(data.enabled ?? true);
            } else {
                createUserNotificationSettings(user.uid);
            }
        } catch (error) {
            console.error('Error fetching notification settings:', error);
            Alert.alert('Error', 'Failed to load notification settings');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchNotificationSettings();
            }
        }, [user])
    );

    const handleSaveSettings = async (): Promise<void> => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        try {
            const reminderSuccess = await updateSetting(user.uid, 'notifications', 'reminderTime', reminderTime);
            const enabledSuccess = await updateSetting(user.uid, 'notifications', 'enabled', notificationsEnabled);

            if (reminderSuccess && enabledSuccess) {
                Alert.alert('Success', 'Notification settings updated successfully');
                router.back();
            } else {
                Alert.alert('Error', 'Failed to update notification settings');
            }
        } catch (error) {
            console.error('Error saving notification settings:', error);
            Alert.alert('Error', 'An error occurred while saving settings');
        }
    };

    const getTimeFromMinutes = (minutes: number): Date => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return new Date(2000, 0, 1, hours, mins, 0);
    };

    // Handle time change from the picker
    const handleTimeChange = (event: DateTimePickerEvent, selectedTime?: Date): void => {
        if (Platform.OS === 'android') {
            setShowReminderPicker(false);
        }

        if (!selectedTime) return;

        const hours = selectedTime.getHours();
        const minutes = selectedTime.getMinutes();
        const totalMinutes = (hours * 60) + minutes;

        setReminderTime(totalMinutes);
    };

    const formatMinutesForDisplay = (minutes: number): string => {
        if (minutes === 0) {
            return 'At time of event';
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        let formattedTime = '';

        if (hours > 0) {
            formattedTime += `${hours} hour${hours > 1 ? 's' : ''}`;
        }

        if (remainingMinutes > 0) {
            if (formattedTime) formattedTime += ' ';
            formattedTime += `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
        }

        return `${formattedTime} before`;
    };

    return (
        <>
            <View style={styles.container}>
                <Header 
                    title='Notification Settings'
                    subtitle='Customise your notification preferences'
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
                                <Text style={styles.sectionTitle}>Notification Preferences</Text>

                                {/* Enable/Disable Notifications */}
                                <View style={styles.menuItem}>
                                    <View style={styles.menuItemContent}>
                                        <Ionicons
                                            name="notifications-outline"
                                            size={24}
                                            color={theme.colours.primary}
                                            style={styles.menuItemIcon}
                                        />
                                        <Text style={styles.menuItemText}>Enable Notifications</Text>
                                    </View>
                                    <View style={styles.switchContainer}>
                                        <Switch
                                            value={notificationsEnabled}
                                            onValueChange={(value) => setNotificationsEnabled(value)}
                                            trackColor={{
                                                false: theme.colours.lightGray,
                                                true: theme.colours.primaryLight50
                                            }}
                                            thumbColor={
                                                notificationsEnabled ?
                                                    theme.colours.primary :
                                                    theme.colours.gray90
                                            }
                                        />
                                    </View>
                                </View>

                                {/* Reminder Time setting */}
                                <View style={[
                                    styles.settingRow,
                                    !notificationsEnabled && styles.disabledSetting
                                ]}>
                                    <View style={styles.settingInfo}>
                                        <View style={styles.timeLabel}>
                                            <View style={styles.iconContainer}>
                                                <MaterialCommunityIcons
                                                    name="clock-time-four-outline"
                                                    size={24}
                                                    color={notificationsEnabled ? theme.colours.primary : theme.colours.gray}
                                                />
                                            </View>
                                            <View style={styles.labelContainer}>
                                                <Text style={[
                                                    styles.settingLabel,
                                                    !notificationsEnabled && styles.disabledText
                                                ]}>
                                                    Reminder Time
                                                </Text>
                                                <Text style={[
                                                    styles.settingValue,
                                                    !notificationsEnabled && styles.disabledText
                                                ]}>
                                                    {formatMinutesForDisplay(reminderTime)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.switchContainer}>
                                        {Platform.OS === 'ios' ? (
                                            <DateTimePicker
                                                value={getTimeFromMinutes(reminderTime)}
                                                mode="time"
                                                display="default"
                                                onChange={handleTimeChange}
                                                style={styles.iosTimePicker}
                                                textColor={theme.colours.textPrimary}
                                                themeVariant="light"
                                                disabled={!notificationsEnabled}
                                            />
                                        ) : (
                                            <>
                                                <TouchableOpacity
                                                    onPress={() => setShowReminderPicker(true)}
                                                    style={[
                                                        styles.actionButton,
                                                        !notificationsEnabled && styles.disabledButton
                                                    ]}
                                                    disabled={!notificationsEnabled}
                                                >
                                                    <Text style={styles.actionButtonText}>Change</Text>
                                                </TouchableOpacity>

                                                {showReminderPicker && (
                                                    <DateTimePicker
                                                        value={getTimeFromMinutes(reminderTime)}
                                                        mode="time"
                                                        display="default"
                                                        onChange={handleTimeChange}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Save button */}
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    These settings control when and if you receive notifications about upcoming appointments and medication reminders.
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
        fontSize: 16,
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
        fontSize: 18,
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
    disabledSetting: {
        opacity: 0.7,
    },
    disabledText: {
        color: theme.colours.gray,
    },
    disabledButton: {
        backgroundColor: theme.colours.gray,
    },
    settingInfo: {
        flex: 1,
    },
    timeLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    labelContainer: {
        flex: 1,
        marginLeft: 8,
    },
    settingLabel: {
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.textPrimary,
    },
    settingValue: {
        fontSize: 14,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
        marginTop: 4,
    },
    switchContainer: {
        width: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iosTimePicker: {
        width: 80,
        marginRight: 10
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuItemIcon: {
        marginRight: 12,
        width: 24,
        height: 24,
        textAlign: 'center',
    },
    menuItemText: {
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colours.primary,
    },
    actionButtonText: {
        fontSize: 14,
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
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.white,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.gray,
        textAlign: 'center',
    },
});

export default NotificationSettingsScreen;
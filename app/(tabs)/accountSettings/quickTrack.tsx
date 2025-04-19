import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useFocusEffect, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { createUserQuickTrackSettings, updateSetting } from '@/services/profileService';
import { useAuth } from '@/context/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import Header from '@/components/header';

interface QuickTrackSettings {
    reminderTime: number;
    enabled: boolean;
    symptoms: {
        mood: boolean;
        pain: boolean;
        energy: boolean;
        digestive: boolean;
        skin: boolean;
        mind: boolean;
        temperature: boolean;
    };
}

const QuickTrackSettingsScreen = () => {
    const { user } = useAuth();
    const router = useRouter();

    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [trackMood, setTrackMood] = useState<boolean>(false);
    const [trackPain, setTrackPain] = useState<boolean>(false);
    const [trackEnergy, setTrackEnergy] = useState<boolean>(false);
    const [trackDigestive, setTrackDigestive] = useState<boolean>(false);
    const [trackSkin, setTrackSkin] = useState<boolean>(false);
    const [trackMind, setTrackMind] = useState<boolean>(false);
    const [trackTemperature, setTrackTemperature] = useState<boolean>(false);

    const fetchQuickTrackSettings = async (): Promise<void> => {
        if (!user?.uid) return;

        setIsLoading(true);
        try {
            const settingsDoc = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'quickTrack'));

            if (settingsDoc.exists()) {
                const data = settingsDoc.data() as QuickTrackSettings;

                // Set symptom tracking states
                if (data.symptoms) {
                    setTrackMood(data.symptoms.mood);
                    setTrackPain(data.symptoms.pain);
                    setTrackEnergy(data.symptoms.energy);
                    setTrackDigestive(data.symptoms.digestive);
                    setTrackSkin(data.symptoms.skin);
                    setTrackMind(data.symptoms.mind);
                    setTrackTemperature(data.symptoms.temperature);
                }
            } else {
                createUserQuickTrackSettings(user.uid);
                setTrackTemperature(true);
                setTrackMood(true);
            }
        } catch (error) {
            console.error('Error fetching quick track settings:', error);
            Alert.alert('Error', 'Failed to load quick track settings');
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) {
                fetchQuickTrackSettings();
            }
        }, [user])
    );

    const handleSaveSettings = async (): Promise<void> => {
        if (!user?.uid) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        try {
            // Update symptom tracking options
            const symptomsSuccess = await updateSetting(
                user.uid,
                'quickTrack',
                'symptoms',
                {
                    mood: trackMood,
                    pain: trackPain,
                    energy: trackEnergy,
                    digestive: trackDigestive,
                    skin: trackSkin,
                    mind: trackMind,
                    temperature: trackTemperature
                }
            );

            if (symptomsSuccess) {
                Alert.alert('Success', 'Quick track settings updated successfully');
                router.back();
            } else {
                Alert.alert('Error', 'Failed to update quick track settings');
            }
        } catch (error) {
            console.error('Error saving quick track settings:', error);
            Alert.alert('Error', 'An error occurred while saving settings');
        }
    };

    const renderSymptomSwitch = (
        title: string,
        value: boolean,
        onValueChange: (value: boolean) => void,
        iconName: "checkbox-marked-circle-outline" | "emoticon-outline" | "pulse" | "lightning-bolt" | "stomach" | "face-man-outline" | "brain" | "thermometer" = "checkbox-marked-circle-outline"
    ) => (
        <View style={styles.menuItem}>
            <View style={styles.menuItemContent}>
                <MaterialCommunityIcons
                    name={iconName}
                    size={24}
                    color={theme.colours.primary}
                    style={styles.menuItemIcon}
                />
                <Text style={styles.menuItemText}>{title}</Text>
            </View>
            <View style={styles.switchContainer}>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{
                        false: theme.colours.lightGray,
                        true: theme.colours.primaryLight50
                    }}
                    thumbColor={
                        value ?
                            theme.colours.primary :
                            theme.colours.gray90
                    }
                />
            </View>
        </View>
    );

    return (
        <>
            <View style={styles.container}>
                <Header
                    title='Quick Track Settings'
                    subtitle='Select what symptoms you want to track from the homepage'
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
                                <Text style={styles.sectionTitle}>Symptoms to Track</Text>

                                {/* Symptom tracking switches */}
                                {renderSymptomSwitch("Mood", trackMood, setTrackMood, "emoticon-outline")}
                                {renderSymptomSwitch("Pain", trackPain, setTrackPain, "pulse")}
                                {renderSymptomSwitch("Energy", trackEnergy, setTrackEnergy, "lightning-bolt")}
                                {renderSymptomSwitch("Digestive", trackDigestive, setTrackDigestive, "stomach")}
                                {renderSymptomSwitch("Skin", trackSkin, setTrackSkin, "face-man-outline")}
                                {renderSymptomSwitch("Mind", trackMind, setTrackMind, "brain")}
                                {renderSymptomSwitch("Temperature", trackTemperature, setTrackTemperature, "thermometer")}
                            </View>

                            {/* Save button */}
                            <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    These settings control what symptoms you want to track from the homepage. You can change these settings at any time.
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

export default QuickTrackSettingsScreen;
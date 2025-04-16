import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Alert, ScrollView, KeyboardAvoidingView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import moment from 'moment';
import { getUserSymptomLogs, saveUserSymptomLog, updateUserSymptomLog } from '@/services/profileService'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '@/components/header';
// Types
interface HeaderProps {
    title: string;
    subtitle: string;
}

// Types
interface MoodOptionProps {
    iconName: string;
    label: string;
    selected: boolean;
    onPress: () => void;
}

// Mood option component
const MoodOption: React.FC<MoodOptionProps> = ({ iconName, label, selected, onPress }) => (
    <TouchableOpacity
        style={[
            styles.moodOption,
            { borderColor: theme.colours.primary },
            selected && { backgroundColor: theme.colours.primary, borderWidth: 2.5 }
        ]}
        onPress={onPress}
    >
        <View style={[styles.iconContainer, { borderColor: theme.colours.primary }]}>
            <FontAwesome5
                name={iconName}
                size={40}
                color={selected ? theme.colours.textOnBlue : theme.colours.primary}
            />
        </View>
        <Text style={[
            styles.optionLabel,
            selected && { color: theme.colours.textOnBlue }
        ]}>
            {label}
        </Text>
    </TouchableOpacity>
);

// Types for mood options
interface MoodOption {
    iconName: string;
    label: string;
    value: string;
}

const MoodTrackingScreen: React.FC = () => {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedMood, setSelectedMood] = useState('');
    const [hasExistingLog, setHasExistingLog] = useState(false);
    const [existingLog, setExistingLog] = useState({});
    const insets = useSafeAreaInsets();
    const bottomMargin = Platform.OS === 'ios' ? 50 + insets.bottom : 70;
    
    const today = moment().format('YYYY-MM-DD');

    // Mood options configuration
    const moodOptions = [
        { iconName: 'frown', label: 'Sad', value: 'sad' },
        { iconName: 'smile', label: 'Happy', value: 'happy' },
        { iconName: 'angry', label: 'Angry', value: 'angry' },
        { iconName: 'sad-tear', label: 'Upset', value: 'upset' },
        { iconName: 'meh-rolling-eyes', label: 'Fed up', value: 'fed-up' },
        { iconName: 'meh-blank', label: 'No feelings', value: 'blank' },
        { iconName: 'meh', label: 'Average', value: 'average' },
        { iconName: 'smile-beam', label: 'Excellent', value: 'excellent' },
    ];
    useFocusEffect(
        useCallback(() => {
            // Check if there's an existing log for today
            const fetchTodayLog = async () => {
                if (!user) return;
                const logs = await getUserSymptomLogs(user.uid);
                if (logs) {
                    const todayLog = logs.find(log => {
                        const data = log.data();
                        return data.date === today;
                    });

                    if (todayLog) {
                        const data = todayLog.data();
                        if (data.symptoms) {
                            setHasExistingLog(true);
                            setExistingLog(data.symptoms);
                            if (data.symptoms.mood) {
                                setSelectedMood(data.symptoms.mood);
                            }
                        }
                    }
                }
            };

            fetchTodayLog();
        }, [user, today])
    );

    const handleDismiss = () => {
        if (router.canDismiss()) {
            router.dismiss();
        } else {
            router.navigate('/(tabs)');
        }
    }

    const handleMoodSelect = (mood: string): void => {
        setSelectedMood(mood === selectedMood ? '' : mood);
    };

    const saveMood = async () => {
        if (!user || !selectedMood) {
            Alert.alert("Error", "Please select a mood before saving.");
            return;
        }

        const logData = {
            ...existingLog,
            date: today,
            mood: selectedMood
        };

        try {
            let result;
            if (hasExistingLog) {
                // Update existing log
                result = await updateUserSymptomLog(user.uid, today, logData);
                if (result) {
                    Alert.alert(
                        "Success",
                        "Your log has been updated.",
                        [{ text: "OK", onPress: handleDismiss }]
                    );
                }
            } else {
                // Create new log
                result = await saveUserSymptomLog(user.uid, logData);
                if (result) {
                    Alert.alert(
                        "Success",
                        "Your mood has been saved.",
                        [{ text: "OK", onPress: handleDismiss }]
                    );
                }
            }
        } catch (error) {
            Alert.alert(
                "Error",
                "There was an error saving your mood. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <>
            <View style={[styles.container, { marginBottom: bottomMargin }]}>
                <Header
                    title="Track Your Mood"
                    subtitle="How are you feeling today?"
                    leftButtonType='back'
                />

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentContainer}>
                        <Text style={styles.instructionText}>Select your current mood:</Text>

                        <View style={styles.moodGrid}>
                            {moodOptions.map((option) => (
                                <MoodOption
                                    key={option.value}
                                    iconName={option.iconName}
                                    label={option.label}
                                    selected={selectedMood === option.value}
                                    onPress={() => handleMoodSelect(option.value)}
                                />
                            ))}
                        </View>
                    </View>
                </ScrollView>

                {/* Save Button Container*/}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            !selectedMood && styles.saveButtonDisabled
                        ]}
                        onPress={saveMood}
                        disabled={!selectedMood}
                    >
                        <Text style={styles.saveButtonText}>Save Mood</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    statusBarContainer: {
        backgroundColor: theme.colours.blue20,
        height: Platform.OS === 'ios' ? 50 : 0
    },
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        paddingBottom: 0,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 0,
    },
    instructionText: {
        fontSize: 18,
        fontFamily: theme.fonts.openSans.semiBold,
        color: theme.colours.textPrimary,
        marginBottom: 20,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    moodOption: {
        width: '48%',
        aspectRatio: 1,
        backgroundColor: theme.colours.background,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabel: {
        marginTop: 10,
        fontSize: 16,
        color: theme.colours.textPrimary,
        textAlign: 'center',
        fontFamily: theme.fonts.openSans.bold,
    },
    saveButtonContainer: {
        padding: 15,
        paddingBottom: 35,
        backgroundColor: theme.colours.background,
        borderTopWidth: 1,
        borderColor: theme.colours.border,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: theme.colours.buttonBlue,
        paddingVertical: 15,
        borderRadius: 30,
        width: "90%",
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: theme.colours.gray,
        opacity: 0.7,
    },
    saveButtonText: {
        color: theme.colours.white,
        fontSize: 18,
        fontFamily: theme.fonts.openSans.semiBold,
    },
});

export default MoodTrackingScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import moment from 'moment';
import { getUserSymptomLogs, saveUserSymptomLog, updateUserSymptomLog } from '@/services/profileService'
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

    useEffect(() => {
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
                    if (data.symptoms && data.symptoms.mood) {
                        setSelectedMood(data.symptoms.mood);
                        setHasExistingLog(true);
                    }
                }
            }
        };

        fetchTodayLog();
    }, [user, today]);

    const handleMoodSelect = (mood: string): void => {
        setSelectedMood(mood === selectedMood ? '' : mood);
    };

    // Reusable component for the header
    const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
        <View style={styles.header}>
            <Text style={styles.headerText}>{title}</Text>
            <Text style={styles.subHeaderText}>{subtitle}</Text>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.dismiss()}
            >
                <FontAwesome5 name="times" size={24} color="white" />
            </TouchableOpacity>
        </View>
    );

    const saveMood = async () => {
        if (!user || !selectedMood) {
            Alert.alert("Error", "Please select a mood before saving.");
            return;
        }

        const logData = {
            date: today,
            symptoms: { mood: selectedMood }
        };

        try {
            let result;
            if (hasExistingLog) {
                // Update existing log
                result = await updateUserSymptomLog(user.uid, today, logData);
                if (result) {
                    Alert.alert(
                        "Success",
                        "Your mood has been updated.",
                        [{ text: "OK", onPress: () => router.dismiss() }]
                    );
                }
            } else {
                // Create new log
                result = await saveUserSymptomLog(user.uid, logData);
                if (result) {
                    Alert.alert(
                        "Success",
                        "Your mood has been saved.",
                        [{ text: "OK", onPress: () => router.dismiss() }]
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
            {/* Status Bar */}
            <View style={styles.statusBarContainer}>
                <StatusBar
                    backgroundColor={theme.colours.blue20}
                    barStyle="light-content"
                />
            </View>

            <View style={styles.container}>
                <Header
                    title="Track Your Mood"
                    subtitle="How are you feeling today?"
                />

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
    header: {
        backgroundColor: theme.colours.blue20,
        padding: 16,
        paddingTop: Platform.OS === 'android' ? 50 : 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        position: 'relative',
    },
    headerText: {
        fontSize: 24,
        fontFamily: theme.fonts.openSans.semiBold || theme.fonts.ubuntu?.bold,
        color: theme.colours.textOnBlue,
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 14,
        fontFamily: theme.fonts.openSans.regular || theme.fonts.ubuntu?.regular,
        color: theme.colours.textOnBlue,
        textAlign: 'center',
        marginTop: 4,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: Platform.OS === 'android' ? 50 : 16,
        padding: 5,
    },
    contentContainer: {
        flex: 1,
        padding: 20,
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
        width: '48%',  // Allows for 2 columns with space in between
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
    saveButton: {
        backgroundColor: theme.colours.buttonBlue,
        paddingVertical: 15,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
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
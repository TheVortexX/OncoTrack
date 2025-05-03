// TODO fix save button padding
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, TextInput, Keyboard, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { theme } from '@/constants/theme';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import moment from 'moment';
import { getUserSymptomLogs, saveUserSymptomLog, updateUserSymptomLog } from '@/services/profileService';
import Header from '@/components/header';

const MIN_TEMP = 33;
const MAX_TEMP = 45;

const clamp = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(value, max));
}

// Thermometer component
const Thermometer: React.FC<{ temperature: number; minTemp?: number; maxTemp?: number }> = ({ temperature, minTemp = 35, maxTemp = 42 }) => {
    // clamp temperature
    const boundedTemp = clamp(temperature, minTemp, maxTemp);

    const animatedHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const fillSpace = 0.3
        const fillPercentage = Math.min(((boundedTemp - minTemp + fillSpace) / (maxTemp - minTemp + fillSpace)) * 100, 100);

        // Animate to new height
        Animated.timing(animatedHeight, {
            toValue: fillPercentage,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [boundedTemp, animatedHeight]);

    // Generate scale markers
    const scaleMarkers = [];
    for (let temp = minTemp; temp <= maxTemp; temp += 0.5) {
        const position = ((temp - minTemp) / (maxTemp - minTemp)) * 100;
        const isMajorMark = temp % 1 === 0;

        scaleMarkers.push(
            <View key={temp} style={[
                styles.scaleMark,
                { bottom: `${position}%` },
                isMajorMark ? styles.majorScaleMark : styles.minorScaleMark
            ]}>
                {isMajorMark && (
                    <Text style={styles.scaleText}>{temp}°</Text>
                )}
            </View>
        );
    }

    return (
        <View style={styles.thermometerContainer}>
            <View style={styles.scaleContainer}>
                {scaleMarkers}
            </View>

            <View style={styles.thermometerBody}>
                <View style={styles.thermometerBulb} />
                <View style={styles.thermometerTube}>
                    <Animated.View
                        style={[
                            styles.thermometerMercury,
                            {
                                height: animatedHeight.interpolate({
                                    inputRange: [0, 100],
                                    outputRange: ['0%', '100%']
                                })
                            }
                        ]}
                    />
                </View>
            </View>

            <View style={styles.currentTempContainer}>
                <Text style={styles.currentTempText}>{temperature.toFixed(1)}°C</Text>
                {getTempIndicatorBox(temperature)}
            </View>
        </View>
    );
};

const getTempIndicatorBox = (temperature: number) => {
    let text = "";
    let colorVal = "";
    if (temperature < 35.0) {
        text = "Low (Hypothermia)";
        colorVal = theme.colours.purple;
    } else if (temperature >= 35.0 && temperature < 36.5) {
        text = "Below Average";
        colorVal = theme.colours.blue80;
    } else if (temperature >= 36.5 && temperature <= 37.5) {
        text = "Normal";
        colorVal = theme.colours.success;
    } else if (temperature > 37.5 && temperature <= 38.0) {
        text = "Elevated";
        colorVal = theme.colours.warning;
    } else if (temperature > 38.0 && temperature <= 40.0) {
        text = "Fever";
        colorVal = theme.colours.danger;
    } else {
        text = "High Fever";
        colorVal = theme.colours.darkDanger;
    }
    return <Text style={[styles.feverIndicator, { color: colorVal, borderColor: colorVal, backgroundColor: `${colorVal}20` }]}>{text}</Text>
}

// Main screen component
const ThermometerScreen = () => {
    const { user } = useAuth();
    const [temperature, setTemperature] = useState(37.0);
    const [temperatureText, setTemperatureText] = useState(temperature.toString());
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [hasExistingLog, setHasExistingLog] = useState(false);
    const [existingLog, setExistingLog] = useState({});
    const insets = useSafeAreaInsets();
    const bottomMargin = Platform.OS === 'ios' ? 50 + insets.bottom : 70;

    const today = moment().format('YYYY-MM-DD');

    const handleDismiss = () => {
        if (router.canDismiss()) {
            router.dismiss();
        } else {
            router.navigate('/(tabs)');
        }
    }

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
                            if (data.symptoms.temperature) {
                                setTemperature(parseFloat(data.symptoms.temperature));
                                setTemperatureText(data.symptoms.temperature.toString());
                            }
                        }
                    }
                }
            };

            fetchTodayLog();
        }, [user, today])
    );

    const handleTemperatureChange = (newTemperature: string) => {
        setTemperatureText(newTemperature);
        const newTemp = parseFloat(newTemperature);
        if (newTemp < 20 || newTemp > 45) return;
        const clampedTemp = clamp(newTemp, MIN_TEMP, MAX_TEMP);
        if (!isNaN(clampedTemp)) {
            setTemperature(clampedTemp);
        }
    };

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    const saveTemperature = async () => {
        if (!user) return;
        const logData = {
            ...existingLog,
            date: today,
            temperature: temperature.toFixed(1)
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
                        "Your temperature has been saved.",
                        [{ text: "OK", onPress: () => handleDismiss }]
                    );
                }
            }
        } catch (error) {
            Alert.alert(
                "Error",
                "There was an error saving your temperature. Please try again.",
                [{ text: "OK" }]
            );
        }
    };

    return (
        <>
            <View style={[styles.container, { marginBottom: bottomMargin }]}>
                <Header 
                    title='Temperature'
                    subtitle='Monitor your body temperature'
                    leftButtonType='close'
                />
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentContainer}>
                        <Thermometer temperature={temperature} minTemp={MIN_TEMP} maxTemp={MAX_TEMP} />

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Set Temperature (°C):</Text>
                            <TextInput
                                style={styles.temperatureInput}
                                keyboardType="numeric"
                                value={temperatureText}
                                onChangeText={(newText) => handleTemperatureChange(newText)}
                                maxLength={4}
                                returnKeyType='done'
                            />
                        </View>

                        <View style={styles.temperatureGuide}>
                            <Text style={styles.guideTitle}>Temperature Guide:</Text>
                            <View style={styles.guideItem}>
                                <View style={[styles.colorIndicator, { backgroundColor: theme.colours.blue80 }]} />
                                <Text style={styles.guideText}>Below 35.0°C: Low (Hypothermia)</Text>
                            </View>
                            <View style={styles.guideItem}>
                                <View style={[styles.colorIndicator, { backgroundColor: theme.colours.success }]} />
                                <Text style={styles.guideText}>36.5°C - 37.5°C: Normal</Text>
                            </View>
                            <View style={styles.guideItem}>
                                <View style={[styles.colorIndicator, { backgroundColor: theme.colours.warning }]} />
                                <Text style={styles.guideText}>37.5°C - 38.0°C: Elevated</Text>
                            </View>
                            <View style={styles.guideItem}>
                                <View style={[styles.colorIndicator, { backgroundColor: theme.colours.danger }]} />
                                <Text style={styles.guideText}>Above 38.0°C: Fever</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Save Button */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => {
                            dismissKeyboard();
                            saveTemperature();
                        }}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={[styles.avoidContainer, Platform.OS === 'android' && isKeyboardVisible && { marginBottom: -85 }]}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? bottomMargin - 50 : 0}
                />
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
    },
    avoidContainer: {
        width: '100%',
        height: 0,
        backgroundColor: theme.colours.blue99,
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
    },
    thermometerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 350,
        marginBottom: 20,
        paddingHorizontal: 20,
        width: '100%',
        marginLeft: '25%'
    },
    thermometerBody: {
        alignItems: 'center',
        height: '100%',
        position: 'relative',
    },
    thermometerBulb: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colours.red,
        borderWidth: 4,
        borderColor: theme.colours.gray60,
        position: 'absolute',
        bottom: 0,
        zIndex: 1,
    },
    thermometerTube: {
        width: 30,
        height: '84.8%',
        backgroundColor: theme.colours.gray80,
        borderWidth: 4,
        borderColor: theme.colours.gray60,
        borderBottomWidth: 0,
        marginBottom: 50,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        overflow: 'hidden',
        zIndex: 2,
    },
    thermometerMercury: {
        width: '100%',
        backgroundColor: theme.colours.red,
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 11,
        borderTopRightRadius: 11,
    },
    scaleContainer: {
        height: '80%',
        width: 60,
        position: 'relative',
        marginRight: 10,
        marginBottom: 60,
    },
    scaleMark: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        right: 0,
    },
    majorScaleMark: {
        width: 20,
        height: 2,
        backgroundColor: theme.colours.blue0,
    },
    minorScaleMark: {
        width: 10,
        height: 1,
        backgroundColor: theme.colours.blue20,
    },
    scaleText: {
        position: 'absolute',
        right: 25,
        fontSize: normaliseSize(12),
        fontFamily: theme.fonts.openSans.regular,
    },
    currentTempContainer: {
        width: '50%',
        marginLeft: 20,
        alignItems: 'center',
    },
    currentTempText: {
        fontSize: normaliseSize(24),
        fontFamily: theme.fonts.openSans.bold,
        color: theme.colours.textPrimary,
    },
    feverIndicator: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.openSans.bold,
        color: theme.colours.danger,
        marginTop: 5,
        padding: 10,
        borderRadius: 10,
        borderWidth: 2,
        textAlign: 'center',
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
        width: '80%',
        justifyContent: 'center',
    },
    inputLabel: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.openSans.regular,
        marginRight: 10,
    },
    temperatureInput: {
        width: 80,
        height: 50,
        borderWidth: 1,
        borderColor: theme.colours.border,
        borderRadius: 8,
        fontSize: normaliseSize(20),
        textAlign: 'center',
        fontFamily: theme.fonts.openSans.semiBold,
    },
    temperatureGuide: {
        width: '80%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: theme.colours.gray99,
    },
    guideTitle: {
        fontSize: normaliseSize(18),
        fontFamily: theme.fonts.openSans.semiBold,
        marginBottom: 10,
    },
    guideItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    colorIndicator: {
        width: 16,
        height: 16,
        borderRadius: 8,
        marginRight: 10,
    },
    guideText: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.openSans.regular,
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
        paddingBottom: 8,
        paddingTop: 6,
        borderRadius: 30,
        width: "90%",
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: theme.colours.white,
        fontSize: normaliseSize(30),
        fontFamily: theme.fonts.openSans.semiBold,
    },
});

export default ThermometerScreen;
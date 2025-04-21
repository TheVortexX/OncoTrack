import React, { useCallback, useEffect, useRef, useState } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, Keyboard, Alert } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import CalendarStrip from 'react-native-calendar-strip';
import { theme } from '@/constants/theme';
import moment from 'moment';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { deleteUserSymptomLog, saveUserSymptomLog, updateUserSymptomLog, getUserSymptomLogs } from '@/services/profileService';
import { useAuth } from '@/context/auth';
import Header from '@/components/header';

// Reusable component for symptom category title
const CategoryTitle = ({ title, learnMore = false }: { title: string, learnMore?: boolean }) => (
    <View style={styles.categoryTitleContainer}>
        <Text style={styles.categoryTitle}>{title}</Text>
        {learnMore && (
            <TouchableOpacity>
                <Text style={styles.learnMore}>Learn more &gt;</Text>
            </TouchableOpacity>
        )}
    </View>
);

interface SymptomOptionProps {
    iconFamily: string;
    iconName: string;
    label: string;
    selected: boolean;
    onPress: () => void;
    color: string;
}

const SymptomOption = ({ iconFamily, iconName, label, selected, onPress, color }: SymptomOptionProps) => {
    let icon = null;
    if (iconFamily === 'FontAwesome5') {
        icon = <FontAwesome5 name={iconName} size={40} color={selected ? theme.colours.textOnBlue : color} />;
    } else if (iconFamily === 'MaterialCommunityIcons') {
        icon = <MaterialCommunityIcons name={iconName as any} size={40} color={selected ? theme.colours.textOnBlue : color} />;
    } else if (iconFamily === 'Ionicons') {
        icon = <Ionicons name={iconName as any} size={40} color={selected ? theme.colours.textOnBlue : color} />;
    } else if (iconFamily === 'Text') {
        icon = <Text style={{ fontSize: normaliseSize(40), color: selected ? theme.colours.textOnBlue : color }} allowFontScaling={false}>{iconName}</Text>;
    }

    return (
        <TouchableOpacity
            style={[
                styles.symptomOption,
                { borderColor: color },
                selected && { backgroundColor: `${color}`, borderWidth: 2.5 }
            ]}
            onPress={onPress}
        >
            <View style={[styles.iconContainer, { borderColor: color }]}>
                {icon}
            </View>
            <Text style={[styles.optionLabel, selected && { color: theme.colours.textOnBlue }]}>{label}</Text>
        </TouchableOpacity>
    )
};

interface DatesWithLogsMap {
    [date: string]: {
        date: moment.Moment;
        symptoms?: Record<string, string>;
    }
}

// Main symptom tracking screen component
const SymptomTrackingScreen = () => {
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const now = useRef(moment());
    const [selectedDate, setSelectedDate] = useState(now.current);
    const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, string>>({});
    const [todaySymptoms, setTodaySymptoms] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [todayNotes, setTodayNotes] = useState('');
    const [datesWithLogs, setDatesWithLogs] = useState<DatesWithLogsMap>({});
    const insets = useSafeAreaInsets()
    const bottomMargin = Platform.OS === 'ios' ? 50 + insets.bottom : 70
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        if (params.today === 'true') {
            setTimeout(() => {
                changeSelectedDate(now.current);
            }, 500);
        }
    }, [params.today]);

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

    useFocusEffect(
        useCallback(() => {
            const fetchLogs = async () => {
                if (!user) return;
                const logs = await getUserSymptomLogs(user.uid);
                const logsMap: DatesWithLogsMap = {};
                if (logs) {
                    logs.forEach((log: any) => {
                        const data = log.data()
                        logsMap[data.date] = {
                            date: moment(data.date, 'YYYY-MM-DD'),
                            symptoms: data.symptoms,
                        }
                        if (moment(data.date, 'YYYY-MM-DD').isSame(selectedDate, 'day')) {
                            setSelectedSymptoms(data.symptoms);
                            setNotes(data.notes || '');
                        }
                    });
                    setDatesWithLogs(logsMap)
                }
            };
            fetchLogs();
        }, [])
    );

    const handleDismiss = () => {
        if (router.canDismiss()) {
            router.dismiss();
        } else {
            router.navigate('/(tabs)');
        }
    }

    const toggleSymptom = (category: string, symptomValue: string) => {
        setSelectedSymptoms(prev => {
            // If already selected this symptom, deselect it
            if (prev[category] === symptomValue) {
                const newState = { ...prev };
                delete newState[category];
                return newState;
            }
            // Otherwise select this symptom
            return { ...prev, [category]: symptomValue };
        });
    };

    const updateSymptoms = (loggedSymptoms: any) => {
        if (!user) return;
        updateUserSymptomLog(user.uid, loggedSymptoms.date, loggedSymptoms).then(res => {
            if (res) {
                setDatesWithLogs(prev => ({
                    ...prev,
                    [loggedSymptoms.date]: {
                        date: moment(loggedSymptoms.date),
                        symptoms: { ...loggedSymptoms.symptoms },
                    },
                }));
                Alert.alert(
                    "Success",
                    "Your symptoms have been updated.",
                    [{
                        text: "OK", onPress: handleDismiss
                    }]
                )
            } else {
                Alert.alert(
                    "Error",
                    "There was an error updating your symptoms. Please try again.",
                    [{ text: "OK" }]
                )
            }
        })
    }

    const saveSymptoms = () => {
        if (!user) return;
        const selectedMoment = moment(selectedDate).startOf('day');

        const loggedSymptoms = {
            ...selectedSymptoms,
            date: selectedMoment.format('YYYY-MM-DD'),
        }

        if (datesWithLogs[selectedMoment.format('YYYY-MM-DD')]) {
            Alert.alert(
                "Update Log",
                `Are you sure you want to update this log on ${selectedDate.format("dddd [the] Do [of] MMMM")}?`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Update",
                        onPress: () => updateSymptoms(loggedSymptoms)
                    }
                ]
            )
        }
        else {
            saveUserSymptomLog(user.uid, loggedSymptoms).then(res => {
                if (res) {
                    setDatesWithLogs(prev => ({
                        ...prev,
                        [selectedMoment.format('YYYY-MM-DD')]: {
                            date: selectedMoment,
                            symptoms: { ...selectedSymptoms },

                        },
                    }));
                    Alert.alert(
                        "Success",
                        "Your symptoms have been saved.",
                        [{ text: "OK", onPress: handleDismiss }]
                    )
                } else {
                    Alert.alert(
                        "Error",
                        "There was an error saving your symptoms. Please try again.",
                        [{ text: "OK" }]
                    )
                }
            })
        }
    }

    const deleteLogPressed = () => {
        Alert.alert(
            "Delete Log",
            "Are you sure you want to delete this log?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteLog()
                        setSelectedSymptoms({});
                    }
                }
            ]
        )
    };

    const deleteLog = () => {
        if (!user) return;
        const selectedMoment = moment(selectedDate).startOf('day');
        deleteUserSymptomLog(user.uid, selectedMoment.format('YYYY-MM-DD'));
        setDatesWithLogs(prev => {
            const newDates = { ...prev };
            delete newDates[selectedMoment.format('YYYY-MM-DD')];
            return newDates;
        });
        setSelectedSymptoms({});
    }

    const customDatesStylesFunc = (date: moment.Moment) => {
        const dateKey = date.format('YYYY-MM-DD');
        const log = datesWithLogs[dateKey];
        const isToday = date.isSame(now.current, 'day');

        if (isToday) {
            if (log || selectedDate.isSame(now.current, 'day')) {
                return customDatesStyles.todaySelected;
            } else {
                return customDatesStyles.today;
            }
        } else if (log) {
            return customDatesStyles.hasLog;
        }
    }

    const changeSelectedDate = (date: moment.Moment) => {
        if (date.isSame(selectedDate, 'day')) return;

        if (selectedDate.isSame(now.current, 'day')) {
            setTodaySymptoms(selectedSymptoms);
            setTodayNotes(notes);
        }

        setSelectedDate(date);

        if (date.isSame(now.current, 'day')) {
            setSelectedSymptoms(todaySymptoms);
            setNotes(todayNotes);
        } else {
            if (datesWithLogs[date.format('YYYY-MM-DD')]) {
                setSelectedSymptoms(datesWithLogs[date.format('YYYY-MM-DD')].symptoms || {});
            } else {
                setSelectedSymptoms({});
            }
        }
    }

    return (
        <>
            <View style={[styles.container, { marginBottom: bottomMargin, paddingBottom: 20 }]}>
                <Header 
                    title='Record Symptoms'
                    subtitle='Track your daily symptoms'
                    leftButtonType='back'
                    rightButtonIcon={<Ionicons name="document-text-outline" size={24} color={theme.colours.white} />}
                    rightButtonText='Report'
                    onRightButtonPress={() => router.navigate('/reports')}
                />
                {/* Calendar Strip */}
                <CalendarStrip
                    scrollable
                    shouldAllowFontScaling={false}
                    style={styles.calendarStrip}
                    startingDate={now.current.clone().subtract(3, 'days')}
                    calendarColor={theme.colours.background}
                    calendarHeaderStyle={styles.calendarHeader}
                    dateNumberStyle={styles.dateNumber}
                    dateNameStyle={styles.dateName}
                    disabledDateNameStyle={styles.disabledDateName}
                    disabledDateNumberStyle={styles.disabledDateNumber}
                    iconContainer={{ flex: 0.1 }}
                    selectedDate={selectedDate}
                    onDateSelected={changeSelectedDate}
                    maxDate={now.current.clone().add(1, 'weeks')}
                    leftSelector={
                        <Ionicons name="chevron-back" size={24} color={theme.colours.blue20} />
                    }
                    rightSelector={
                        <Ionicons name="chevron-forward" size={24} color={theme.colours.blue20} />
                    }
                    showMonth={true}

                    datesBlacklist={date => { return date.isAfter(now.current, 'day') }}
                    highlightDateContainerStyle={{ borderColor: theme.colours.border, borderWidth: 2}}
                    customDatesStyles={customDatesStylesFunc}
                />

                <ScrollView style={styles.scrollView}>
                    {selectedDate.isSame(now.current, 'day') && !datesWithLogs[selectedDate.format('YYYY-MM-DD')] && (
                        <View style={styles.warningMessageContainer}>
                            <Text style={styles.warningMessageText}>
                                You haven't logged any symptoms for today yet.
                            </Text>
                        </View>
                    )}

                    {/* Feelings Section */}
                    <CategoryTitle title="Feelings" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="smile-beam"
                            label="Excellent"
                            selected={selectedSymptoms['mood'] === 'excellent'}
                            onPress={() => toggleSymptom('mood', 'excellent')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="smile"
                            label="Happy"
                            selected={selectedSymptoms['mood'] === 'happy'}
                            onPress={() => toggleSymptom('mood', 'happy')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="meh"
                            label="Average"
                            selected={selectedSymptoms['mood'] === 'average'}
                            onPress={() => toggleSymptom('mood', 'average')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="meh-blank"
                            label="No feelings"
                            selected={selectedSymptoms['mood'] === 'blank'}
                            onPress={() => toggleSymptom('mood', 'blank')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="meh-rolling-eyes"
                            label="Fed up"
                            selected={selectedSymptoms['mood'] === 'fed-up'}
                            onPress={() => toggleSymptom('mood', 'fed-up')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="frown"
                            label="Sad"
                            selected={selectedSymptoms['mood'] === 'sad'}
                            onPress={() => toggleSymptom('mood', 'sad')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="sad-tear"
                            label="Upset"
                            selected={selectedSymptoms['mood'] === 'upset'}
                            onPress={() => toggleSymptom('mood', 'upset')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="angry"
                            label="Angry"
                            selected={selectedSymptoms['mood'] === 'angry'}
                            onPress={() => toggleSymptom('mood', 'angry')}
                            color={theme.colours.primary}
                        />
                    </ScrollView>

                    {/* Pain Section */}
                    <CategoryTitle title="Pain" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="smile"
                            label="Pain free"
                            selected={selectedSymptoms['pain'] === 'pain-free'}
                            onPress={() => toggleSymptom('pain', 'pain-free')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="head-side-virus"
                            label="Headache"
                            selected={selectedSymptoms['pain'] === 'headache'}
                            onPress={() => toggleSymptom('pain', 'headache')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="stomach"
                            label="Stomach"
                            selected={selectedSymptoms['pain'] === 'stomach'}
                            onPress={() => toggleSymptom('pain', 'stomach')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="bone"
                            label="Joint/Bone"
                            selected={selectedSymptoms['pain'] === 'joint'}
                            onPress={() => toggleSymptom('pain', 'joint')}
                            color={theme.colours.blue20}
                        />
                    </ScrollView>

                    {/* Pain Intensity Section */}
                    <CategoryTitle title="Pain Intensity" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="Text"
                            iconName="1"
                            label="Mild"
                            selected={selectedSymptoms['pain-intensity'] === 'mild'}
                            onPress={() => toggleSymptom('pain-intensity', 'mild')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="Text"
                            iconName="2"
                            label="Moderate"
                            selected={selectedSymptoms['pain-intensity'] === 'moderate'}
                            onPress={() => toggleSymptom('pain-intensity', 'moderate')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="Text"
                            iconName="3"
                            label="Severe"
                            selected={selectedSymptoms['pain-intensity'] === 'severe'}
                            onPress={() => toggleSymptom('pain-intensity', 'severe')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="Text"
                            iconName="4"
                            label="Extreme"
                            selected={selectedSymptoms['pain-intensity'] === 'extreme'}
                            onPress={() => toggleSymptom('pain-intensity', 'extreme')}
                            color={theme.colours.blue20}
                        />
                    </ScrollView>

                    {/* Energy Section */}
                    <CategoryTitle title="Energy" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="sleep"
                            label="Exhausted"
                            selected={selectedSymptoms['energy'] === 'exhausted'}
                            onPress={() => toggleSymptom('energy', 'exhausted')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="battery-low"
                            label="Tired"
                            selected={selectedSymptoms['energy'] === 'tired'}
                            onPress={() => toggleSymptom('energy', 'tired')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="battery-medium"
                            label="Ok"
                            selected={selectedSymptoms['energy'] === 'ok'}
                            onPress={() => toggleSymptom('energy', 'ok')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="battery-high"
                            label="Energetic"
                            selected={selectedSymptoms['energy'] === 'energetic'}
                            onPress={() => toggleSymptom('energy', 'energetic')}
                            color={theme.colours.primary}
                        />
                    </ScrollView>

                    {/* Digestive Section */}
                    <CategoryTitle title="Digestive" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="emoticon-sick-outline"
                            label="Nausea"
                            selected={selectedSymptoms['digestive'] === 'nausea'}
                            onPress={() => toggleSymptom('digestive', 'nausea')}
                            color={theme.colours.success}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="stomach"
                            label="Vomiting"
                            selected={selectedSymptoms['digestive'] === 'vomiting'}
                            onPress={() => toggleSymptom('digestive', 'vomiting')}
                            color={theme.colours.success}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="food-fork-drink"
                            label="No appetite"
                            selected={selectedSymptoms['digestive'] === 'no-appetite'}
                            onPress={() => toggleSymptom('digestive', 'no-appetite')}
                            color={theme.colours.success}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="food"
                            label="Normal"
                            selected={selectedSymptoms['digestive'] === 'normal'}
                            onPress={() => toggleSymptom('digestive', 'normal')}
                            color={theme.colours.success}
                        />
                    </ScrollView>

                    {/* Skin Section */}
                    <CategoryTitle title="Skin" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="emoticon"
                            label="Normal"
                            selected={selectedSymptoms['skin'] === 'normal'}
                            onPress={() => toggleSymptom('skin', 'normal')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="weather-sunny"
                            label="Rash"
                            selected={selectedSymptoms['skin'] === 'rash'}
                            onPress={() => toggleSymptom('skin', 'rash')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="water"
                            label="Dry"
                            selected={selectedSymptoms['skin'] === 'dry'}
                            onPress={() => toggleSymptom('skin', 'dry')}
                            color={theme.colours.primary}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="palette"
                            label="Discoloration"
                            selected={selectedSymptoms['skin'] === 'discoloration'}
                            onPress={() => toggleSymptom('skin', 'discoloration')}
                            color={theme.colours.primary}
                        />
                    </ScrollView>

                    {/* Mind Section */}
                    <CategoryTitle title="Mind" />
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        style={styles.optionsRowScroll}
                        contentContainerStyle={styles.optionsScrollContent}
                    >
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="cloud"
                            label="Foggy"
                            selected={selectedSymptoms['mind'] === 'foggy'}
                            onPress={() => toggleSymptom('mind', 'foggy')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="question-circle"
                            label="Forgetful"
                            selected={selectedSymptoms['mind'] === 'forgetful'}
                            onPress={() => toggleSymptom('mind', 'forgetful')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="FontAwesome5"
                            iconName="bolt"
                            label="Anxious"
                            selected={selectedSymptoms['mind'] === 'anxious'}
                            onPress={() => toggleSymptom('mind', 'anxious')}
                            color={theme.colours.blue20}
                        />
                        <SymptomOption
                            iconFamily="MaterialCommunityIcons"
                            iconName="meditation"
                            label="Calm"
                            selected={selectedSymptoms['mind'] === 'calm'}
                            onPress={() => toggleSymptom('mind', 'calm')}
                            color={theme.colours.blue20}
                        />
                    </ScrollView>

                    {/* Temperature Section */}
                    <CategoryTitle title="Temperature" />
                    <View style={styles.valueInputContainer}>
                        <TextInput
                            style={styles.valueInput}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={theme.colours.gray}
                            onChangeText={(text) => toggleSymptom('temperature', text)}
                            value={selectedSymptoms['temperature'] || ''}
                            returnKeyType='done'
                        />
                        <Text style={styles.valueUnit}>°C</Text>
                    </View>

                    {/* Notes Section */}
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>Daily notes</Text>
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Any extra details to add today?"
                            placeholderTextColor={theme.colours.gray}
                            multiline
                            numberOfLines={4}
                            onChangeText={setNotes}
                            value={notes}
                        />
                    </View>

                    {!selectedDate.isSame(now.current, 'day') && (
                        <TouchableOpacity
                            onPress={deleteLogPressed}
                            style={styles.deleteLogButton}
                        >
                            <Text style={styles.deleteLogText}>Delete log</Text>
                        </TouchableOpacity>
                    )}

                    {/* Bottom padding to ensure all content is scrollable past the save button */}
                    <View style={styles.bottomPadding} />
                </ScrollView>


                {/* Save Button */}
                <View style={styles.saveButtonContainer}>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={saveSymptoms}
                    >
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={[styles.avoidContainer, Platform.OS === 'android' && isKeyboardVisible && { marginBottom: -85 }]}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? bottomMargin - 35 : 0}
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
    },
    calendarStrip: {
        height: 100,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderColor: theme.colours.border,
    },
    calendarHeader: {
        color: theme.colours.textPrimary,
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.openSans.semiBold,
    },
    dateNumber: {
        color: theme.colours.textPrimary,
        fontFamily: theme.fonts.openSans.regular,
    },
    dateName: {
        color: theme.colours.textSecondary,
        fontFamily: theme.fonts.openSans.regular,
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 15,
    },
    categoryTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    categoryTitle: {
        fontSize: normaliseSize(20),
        color: theme.colours.textPrimary,
        fontFamily: theme.fonts.openSans.semiBold,
    },
    learnMore: {
        color: theme.colours.buttonBlue,
        fontFamily: theme.fonts.openSans.regular,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    optionsRowScroll: {
        flexDirection: 'row',
        marginBottom: 10,
        marginLeft: 0,
    },
    optionsScrollContent: {
        paddingRight: 10,
        paddingLeft: 0,
        paddingBottom: 10,
    },
    symptomOption: {
        width: 85,
        aspectRatio: 1,
        backgroundColor: theme.colours.background,
        borderRadius: 10,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        marginRight: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    iconContainer: {
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: normaliseSize(12),
        color: theme.colours.textPrimary,
        textAlign: 'center',
        fontFamily: theme.fonts.openSans.bold,
    },
    valueInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colours.gray99,
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 60,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: theme.colours.border,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    valueInput: {
        flex: 1,
        color: theme.colours.textPrimary,
        fontSize: normaliseSize(24),
        fontFamily: theme.fonts.openSans.semiBold,
    },
    valueUnit: {
        color: theme.colours.textSecondary,
        fontSize: normaliseSize(24),
        fontFamily: theme.fonts.openSans.regular,
    },
    notesContainer: {
        marginTop: 20,
    },
    notesLabel: {
        fontSize: normaliseSize(18),
        color: theme.colours.textPrimary,
        marginBottom: 10,
        fontFamily: theme.fonts.openSans.semiBold,
    },
    notesInput: {
        backgroundColor: theme.colours.gray99,
        borderRadius: 10,
        padding: 15,
        color: theme.colours.textPrimary,
        height: 100,
        textAlignVertical: 'top',
        fontFamily: theme.fonts.openSans.regular,
        borderWidth: 1,
        borderColor: theme.colours.border,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    tagsContainer: {
        marginTop: 20,
    },
    tagsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    tagsLabel: {
        fontSize: normaliseSize(18),
        color: theme.colours.textPrimary,
        fontFamily: theme.fonts.openSans.semiBold,
    },
    createTagButton: {},
    createTagText: {
        color: theme.colours.buttonBlue,
        fontFamily: theme.fonts.openSans.regular,
    },
    noTagsContainer: {
        borderWidth: 1,
        borderColor: theme.colours.border,
        borderRadius: 10,
        borderStyle: 'dashed',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noTagsText: {
        color: theme.colours.gray,
        fontFamily: theme.fonts.openSans.regular,
    },
    saveButtonContainer: {
        padding: 15,
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
    bottomPadding: {
        height: 20,
    },
    disabledDateName: {
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.gray20,
        fontSize: normaliseSize(12),
    },
    disabledDateNumber: {
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.gray20,
        fontSize: normaliseSize(14),
    },
    warningMessageContainer: {
        backgroundColor: theme.colours.primaryLight25,
        borderRadius: 8,
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colours.primaryLight50,
    },
    warningMessageText: {
        fontFamily: theme.fonts.openSans.regular,
        fontSize: normaliseSize(14),
        color: theme.colours.blue0,
        flex: 1,
    },
    deleteLogButton: {
        borderRadius: 8,
        borderColor: theme.colours.danger,
        borderWidth: 3,
        backgroundColor: 'transparent',
        marginTop: 50,
    },
    deleteLogText: {
        fontFamily: theme.fonts.openSans.semiBold,
        fontSize: normaliseSize(18),
        color: theme.colours.danger,
        padding: 10,
        textAlign: 'center',
    },
});

const customDatesStyles = {
    todaySelected: {
        dateContainerStyle: {
            backgroundColor: theme.colours.primary,
            borderRadius: 30,
        },
        dateNameStyle: [styles.dateName, { color: 'white' }],
        dateNumberStyle: [styles.dateNumber, { color: 'white' }],
        highlightDateNameStyle: { color: theme.colours.textOnPrimary, fontFamily: theme.fonts.openSans.semiBold, fontSize: normaliseSize(12) },
        highlightDateNumberStyle: { color: theme.colours.textOnPrimary, fontFamily: theme.fonts.openSans.bold, fontSize: normaliseSize(16) },
    },
    today: {
        dateContainerStyle: {
            borderWidth: 2.5,
            borderColor: theme.colours.primary,
            borderRadius: 30,
            backgroundColor: 'transparent'
        },
    },
    hasLog: {
        dateContainerStyle: {
            backgroundColor: theme.colours.blue80,
            borderRadius: 30,
        },
        dateNameStyle: { color: 'white' },
        dateNumberStyle: { color: 'white' }
    },
}

export default SymptomTrackingScreen;
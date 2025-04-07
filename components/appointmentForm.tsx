import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import InputField from '@/components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import PickerModal from '@/components/iosPicker';
import moment from 'moment';
import { theme } from '@/constants/theme';
import { Picker } from '@react-native-picker/picker';

interface Appointment {
    id: string;
    description: string;
    provider: string;
    startTime: moment.Moment;
    endTime: moment.Moment;
    appointmentType: string;
    staff: string;
    travelTime: moment.Duration;
    [key: string]: any; // Allow additional properties
}

interface AppointmentFormProps {
    onSave: (appointment: Appointment) => void;
    readonly?: boolean;
    triggerSave?: boolean;
    existingAppointment?: Appointment;
    initialDate?: moment.Moment;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
    onSave,
    existingAppointment,
    triggerSave = false,
    readonly = false,
    initialDate = moment()
}) => {
    const [provider, setProvider] = useState(existingAppointment?.provider || '');
    const [staff, setStaff] = useState(existingAppointment?.staff || '');
    const [description, setDescription] = useState(existingAppointment?.description || '');
    const [appointmentType, setAppointmentType] = useState(existingAppointment?.appointmentType || 'Consultation');
    const [startDate, setStartDate] = useState(existingAppointment?.startTime || initialDate);
    const [endDate, setEndDate] = useState(existingAppointment?.endTime || initialDate.clone().add(1, 'hour'));
    const [travelTime, setTravelTime] = useState<moment.Duration>(
        existingAppointment?.travelTime || moment.duration({ minutes: 0 })
    );
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    // State for showing/hiding date and time pickers
    const [showStartDate, setShowStartDate] = useState(false);
    const [showStartTime, setShowStartTime] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);
    const [showTravelTime, setShowTravelTime] = useState(false);

    const appointmentTypes = ['Consultation', 'Treatment', 'Check-up', 'Test', 'Surgery', 'Medication', 'Appointment', 'Other'];

    useEffect(() => {
        if (triggerSave) {
            handleSave();
        }
    }, [triggerSave]);

    const handleSave = () => {
        const newAppointment: Appointment = {
            id: existingAppointment?.id || "temp-app-id",
            description,
            provider,
            startTime: startDate,
            endTime: endDate,
            appointmentType,
            staff,
            travelTime: travelTime
        };

        onSave(newAppointment);
    };

    // Function to handle date change (for both start and end)
    const handleDateChange = (event: any, date: Date | undefined, isStart: boolean) => {
        if (Platform.OS === 'android') {
            if (isStart) {
                setShowStartDate(false);
            } else {
                setShowEndDate(false);
            }
        }

        if (!date) return;

        const newMoment = moment(date);

        if (isStart) {
            // Preserve the original time
            const newDate = startDate.clone()
                .year(newMoment.year())
                .month(newMoment.month())
                .date(newMoment.date());

            setStartDate(newDate);

            // If end date is before start date, update it
            if (endDate.isBefore(newDate)) {
                setEndDate(newDate.clone().add(1, 'hour'));
            }
        } else {
            // Preserve the original time
            const newDate = endDate.clone()
                .year(newMoment.year())
                .month(newMoment.month())
                .date(newMoment.date());

            setEndDate(newDate);
        }
    };

    // Function to handle time change (for both start and end)
    const handleTimeChange = (event: any, date: Date | undefined, isStart: boolean) => {
        if (Platform.OS === 'android') {
            if (isStart) {
                setShowStartTime(false);
            } else {
                setShowEndTime(false);
            }
        }

        if (!date) return;

        const newMoment = moment(date);

        if (isStart) {
            // Preserve the original date
            const newTime = startDate.clone()
                .hour(newMoment.hour())
                .minute(newMoment.minute());

            setStartDate(newTime);

            // If end time is before start time on the same day, update it
            if (endDate.isSame(newTime, 'day') && endDate.isBefore(newTime)) {
                setEndDate(newTime.clone().add(1, 'hour'));
            }
        } else {
            // Preserve the original date
            const newTime = endDate.clone()
                .hour(newMoment.hour())
                .minute(newMoment.minute());

            // Don't allow end time to be before start time on the same day
            if (newTime.isSame(startDate, 'day') && newTime.isBefore(startDate)) {
                newTime.hour(startDate.hour() + 1);
                newTime.minute(startDate.minute());
            }

            setEndDate(newTime);
        }
    };

    const handleTravelTimeChange = (event: any, date: Date | undefined) => {
        if (Platform.OS === 'android') {
            setShowTravelTime(false);
        }

        if (!date) return;

        // Convert the selected time to duration
        const hours = date.getHours();
        const minutes = date.getMinutes();
        setTravelTime(moment.duration({ hours, minutes }));
    };

    const durationToDate = (duration: moment.Duration): Date => {
        const date = new Date();
        date.setHours(duration.hours());
        date.setMinutes(duration.minutes());
        date.setSeconds(0);
        return date;
    };

    const formatDateForButton = (date: moment.Moment): string => {
        return date.format('ddd, MMM DD, YYYY');
    };

    const formatTimeForButton = (time: moment.Moment): string => {
        return time.format('h:mm A');
    };

    const formatTravelTime = (duration: moment.Duration): string => {
        const hours = duration.hours();
        const minutes = duration.minutes();
        if (hours === 0 && minutes === 0) return 'None';
        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours} hr`;
        return `${hours} hr ${minutes} min`;
    };

    const pickerItems = appointmentTypes.map(type => ({
        label: type,
        value: type
    }));

    // Platform-specific picker rendering
    const renderPicker = () => {
        if (Platform.OS === 'ios') {
            return (
                <TouchableOpacity
                    onPress={() => setIsPickerVisible(true)}
                    disabled={readonly}
                    style={styles.iosPickerButton}
                >
                    <Text style={styles.iosPickerText}>{appointmentType}</Text>

                    <PickerModal
                        isVisible={isPickerVisible}
                        onClose={() => setIsPickerVisible(false)}
                        onConfirm={(value) => setAppointmentType(value)}
                        value={appointmentType}
                        items={pickerItems}
                        title="Appointment Type"
                    />
                </TouchableOpacity>
            );
        } else {
            return (
                <View style={styles.pickerBox}>
                    <Picker
                        selectedValue={appointmentType}
                        onValueChange={(itemValue) => setAppointmentType(itemValue)}
                        enabled={!readonly}
                        style={styles.picker}
                        dropdownIconColor="black"
                        mode="dropdown"
                        >
                        {appointmentTypes.map((type) => (
                            <Picker.Item key={type} label={type} value={type} color="black" />
                        ))}
                    </Picker>
                </View>
            );
        }
    };

    // Render date and time pickers based on platform
    const renderDateTimePickers = () => {
        if (Platform.OS === 'ios') {
            // iOS - Always render pickers inline
            return (
                <>
                    {/* Start date/time section */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Starts</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* Start date button */}
                            <View style={styles.datePickerWrapper}>
                                <DateTimePicker
                                    value={startDate.toDate()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => handleDateChange(event, date, true)}
                                    textColor={theme.colours.textPrimary}
                                    themeVariant="light"
                                />
                            </View>

                            {/* Start time button */}
                            <View style={styles.timePickerWrapper}>
                                <DateTimePicker
                                    value={startDate.toDate()}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => handleTimeChange(event, date, true)}
                                    is24Hour={true}
                                    textColor={theme.colours.textPrimary}
                                    minuteInterval={15}
                                    themeVariant="light"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* End date/time section */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Ends</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* End date button */}
                            <View style={styles.datePickerWrapper}>
                                <DateTimePicker
                                    value={endDate.toDate()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => handleDateChange(event, date, false)}
                                    textColor={theme.colours.textPrimary}
                                    themeVariant="light"
                                />
                            </View>

                            {/* End time button */}
                            <View style={styles.timePickerWrapper}>
                                <DateTimePicker
                                    value={endDate.toDate()}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => handleTimeChange(event, date, false)}
                                    is24Hour={true}
                                    textColor={theme.colours.textPrimary}
                                    minuteInterval={15}
                                    themeVariant="light"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* Travel time section */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Travel Time</Text>
                        <View style={styles.dateTimeContainer}>
                            <View style={styles.timePickerWrapper}>
                                <DateTimePicker
                                    value={durationToDate(travelTime)}
                                    mode="time"
                                    display="default"
                                    onChange={handleTravelTimeChange}
                                    is24Hour={true}
                                    textColor={theme.colours.textPrimary}
                                    minuteInterval={15}
                                    themeVariant="light"
                                />
                            </View>
                        </View>
                    </View>
                </>
            );
        } else {
            // Android - Use buttons and show pickers only when needed
            return (
                <>
                    {/* Start date/time section */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Starts</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* Start date button */}
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowStartDate(true)}
                                disabled={readonly}
                            >
                                <Text style={styles.datePickerButtonText}>
                                    {formatDateForButton(startDate)}
                                </Text>
                            </TouchableOpacity>

                            {/* Start time button */}
                            <TouchableOpacity
                                style={styles.timePickerButton}
                                onPress={() => setShowStartTime(true)}
                                disabled={readonly}
                            >
                                <Text style={styles.timePickerButtonText}>
                                    {formatTimeForButton(startDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* End date/time section */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Ends</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* End date button */}
                            <TouchableOpacity
                                style={styles.datePickerButton}
                                onPress={() => setShowEndDate(true)}
                                disabled={readonly}
                            >
                                <Text style={styles.datePickerButtonText}>
                                    {formatDateForButton(endDate)}
                                </Text>
                            </TouchableOpacity>

                            {/* End time button */}
                            <TouchableOpacity
                                style={styles.timePickerButton}
                                onPress={() => setShowEndTime(true)}
                                disabled={readonly}
                            >
                                <Text style={styles.timePickerButtonText}>
                                    {formatTimeForButton(endDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* Travel time section */}
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Travel Time</Text>
                        <View style={styles.dateTimeContainer}>
                            <TouchableOpacity
                                style={styles.timePickerButton}
                                onPress={() => setShowTravelTime(true)}
                                disabled={readonly}
                            >
                                <Text style={styles.timePickerButtonText}>
                                    {formatTravelTime(travelTime)}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Render Android pickers when state is true */}
                    {showStartDate && (
                        <DateTimePicker
                            value={startDate.toDate()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => handleDateChange(event, date, true)}
                        />
                    )}

                    {showStartTime && (
                        <DateTimePicker
                            value={startDate.toDate()}
                            mode="time"
                            display="default"
                            onChange={(event, date) => handleTimeChange(event, date, true)}
                            is24Hour={true}
                        />
                    )}

                    {showEndDate && (
                        <DateTimePicker
                            value={endDate.toDate()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => handleDateChange(event, date, false)}
                        />
                    )}

                    {showEndTime && (
                        <DateTimePicker
                            value={endDate.toDate()}
                            mode="time"
                            display="default"
                            onChange={(event, date) => handleTimeChange(event, date, false)}
                            is24Hour={true}
                        />
                    )}

                    {showTravelTime && (
                        <DateTimePicker
                            value={durationToDate(travelTime)}
                            mode="time"
                            display="default"
                            onChange={handleTravelTimeChange}
                            is24Hour={true}
                            minuteInterval={15}
                        />
                    )}
                </>
            );
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Input fields container */}
            <View style={styles.mergedContainer}>
                <InputField
                    value={provider}
                    onChangeText={setProvider}
                    placeholder="Provider (Hospital/Clinic)"
                    style={{
                        input: styles.input,
                        container: styles.inputContainer,
                        errorInput: styles.errorInput,
                        errorText: styles.errorText
                    }}
                />

                <View style={styles.innerDivider} />

                <InputField
                    value={staff}
                    onChangeText={setStaff}
                    placeholder="Staff/Doctor"
                    style={{
                        input: styles.input,
                        container: styles.inputContainer,
                        errorInput: styles.errorInput,
                        errorText: styles.errorText
                    }}
                />

                <View style={styles.innerDivider} />

                <InputField
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description/Purpose"
                    multiline
                    style={{
                        input: styles.descriptionInput,
                        container: styles.inputContainer,
                        errorInput: styles.errorInput,
                        errorText: styles.errorText
                    }}
                />
            </View>

            {/* Time settings container */}
            <View style={styles.mergedContainer}>
                {renderDateTimePickers()}
            </View>

            {/* Appointment Type */}
            <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>Appointment Type</Text>
                {renderPicker()}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mergedContainer: {
        backgroundColor: theme.colours.surface,
        borderRadius: 10,
        marginVertical: 10,
        overflow: 'hidden',
        marginHorizontal: 10,
    },
    input: {
        width: '100%',
        height: 50,
        paddingHorizontal: 10,
        backgroundColor: theme.colours.surface,
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    descriptionInput: {
        flexGrow: 1,
        width: '100%',
        minHeight: 50,
        paddingHorizontal: 10,
        paddingVertical: 15,
        backgroundColor: theme.colours.surface,
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    innerDivider: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.lightGray,
    },
    inputContainer: {
        padding: 0,
        margin: 0,
    },
    errorInput: {
        borderColor: theme.colours.primary,
        borderWidth: 2,
    },
    errorText: {
        color: theme.colours.primary,
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.regular,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    timeLabel: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        color: theme.colours.textPrimary,
    },
    dateTimeContainer: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    datePickerWrapper: {
        paddingVertical: 8,
    },
    timePickerWrapper: {
        marginLeft: 8,
        paddingVertical: 8,
    },
    datePickerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: theme.colours.blue80,
        marginRight: 8,
    },
    timePickerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: theme.colours.blue80,
    },
    datePickerButtonText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textPrimary,
    },
    timePickerButtonText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textPrimary,
    },
    travelTimeButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    durationText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 18,
        color: theme.colours.textSecondary,
    },
    pickerContainer: {
        borderRadius: 8,
        marginHorizontal: 12,
        marginBottom: 16,
        backgroundColor: theme.colours.surface,
        ...Platform.select({
            ios: {
                height: 70,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between', // This will push elements to the ends
                paddingLeft: 12,
            },
            android: {
                height: 110,
            },
        }),
    },
    pickerLabel: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        color: theme.colours.textPrimary,
        padding: 12,
        ...Platform.select({
            ios: {
                flex: 1,
                marginBottom: 0,
                padding: 0,
            },
            android: {
                padding: 12,
            }
        }),
    },
    iosPickerButton: {
        paddingVertical: 15,
        marginRight: 12,
        marginVertical: 6,
        paddingHorizontal: 5,
        backgroundColor: theme.colours.gray50,
        borderRadius: 8,
        alignItems: 'flex-end',
    },
    iosPickerText: {
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.textPrimary,
    },
    picker: {
        height: 50,
        color: theme.colours.textPrimary,
    },
    pickerBox: {
        backgroundColor: theme.colours.gray50,
        borderRadius: 8,
        paddingBottom: 5,
        margin: 10,
        marginVertical: 0,
    },
});

export default AppointmentForm;
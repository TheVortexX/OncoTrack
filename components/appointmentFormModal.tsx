import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import InputField from '@/components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from '@/components/modal';
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
    readonly?: boolean;
    existingAppointment?: Appointment | null;
    initialDate?: moment.Moment;
    visible: boolean;
    onClose: () => void;
    title?: string;
    leftButtonText?: string;
    rightButtonText?: string;
    onLeftButtonPress?: () => void;
    onRightButtonPress?: ({ }) => void;
    backgroundColor?: string;
    onDeleteAppointment?: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({
    existingAppointment,
    visible,
    onClose,
    title,
    leftButtonText,
    rightButtonText,
    onLeftButtonPress,
    onRightButtonPress,
    backgroundColor,
    readonly = false,
    initialDate = moment(),
    onDeleteAppointment = () => { },
}) => {
    const originalAppointmentRef = useRef<Appointment | null | undefined>(null);

    const [provider, setProvider] = useState('');
    const [staff, setStaff] = useState('');
    const [description, setDescription] = useState('');
    const [appointmentType, setAppointmentType] = useState('Consultation');
    const [startDate, setStartDate] = useState(initialDate);
    const [endDate, setEndDate] = useState(initialDate.clone().add(1, 'hour'));
    const [travelTime, setTravelTime] = useState<moment.Duration>(moment.duration({ minutes: 0 }));
    const [notes, setNotes] = useState('');
    const [isPickerVisible, setIsPickerVisible] = useState(false);

    // State for showing/hiding date and time pickers
    const [showStartDate, setShowStartDate] = useState(false);
    const [showStartTime, setShowStartTime] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);
    const [showTravelTime, setShowTravelTime] = useState(false);

    const appointmentTypes = ['Appointment', 'Check-up', 'Consultation', 'Medication', 'Surgery', 'Test', 'Treatment', 'Other'];


    const saveOriginalAppointment = (appointment?: Appointment | null) => {
        if (!appointment) {
            originalAppointmentRef.current = null;
            return;
        }

        originalAppointmentRef.current = {
            ...appointment,
            startTime: moment(appointment.startTime),
            endTime: moment(appointment.endTime),
            travelTime: moment.duration(appointment.travelTime),
        };
    };

    const resetFormState = () => {
        const original = originalAppointmentRef.current;

        if (original) {
            setProvider(original.provider);
            setStaff(original.staff);
            setDescription(original.description);
            setStartDate(moment(original.startTime));
            setEndDate(moment(original.endTime));
            setTravelTime(moment.duration(original.travelTime));
            setNotes(original.notes || '');
            setAppointmentType(original.appointmentType || 'Consultation');
        } else {
            setProvider('');
            setStaff('');
            setDescription('');
            setStartDate(initialDate);
            setEndDate(initialDate.clone().add(1, 'hour'));
            setTravelTime(moment.duration({ minutes: 0 }));
            setNotes('');
            setAppointmentType('Consultation');
        }
    };

    useEffect(() => {
        if (visible) {
            saveOriginalAppointment(existingAppointment);
            resetFormState();
        }
    }, [existingAppointment, visible]);

    const handleSave = () => {
        const newAppointment: Appointment = {
            id: existingAppointment?.id || "temp-app-id",
            description,
            provider,
            startTime: startDate,
            endTime: endDate,
            appointmentType,
            staff,
            travelTime,
            notes,
        };

        onRightButtonPress && onRightButtonPress(newAppointment);
    };

    const handleCancel = () => {
        resetFormState();
        onLeftButtonPress && onLeftButtonPress();
    };

    // Function to handle date change (for both start and end)
    const handleDateChange = (event: any, date: Date | undefined, isStart: boolean) => {
        if (readonly) return;

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
        if (readonly) return;

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
        if (readonly) return;

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

    // Get styles for readonly fields
    const getReadonlyStyle = () => {
        return readonly ? {
            backgroundColor: theme.colours.gray50,
            color: theme.colours.textSecondary,
        } : {};
    };

    // Platform-specific picker rendering
    const renderPicker = () => {
        if (Platform.OS === 'ios') {
            return (
                <TouchableOpacity
                    onPress={() => !readonly && setIsPickerVisible(true)}
                    disabled={readonly}
                    style={[styles.iosPickerButton, getReadonlyStyle()]}
                >
                    <Text style={[styles.iosPickerText, readonly && styles.readonlyText]}>
                        {appointmentType}
                    </Text>

                    <PickerModal
                        isVisible={isPickerVisible && !readonly}
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
                <View style={[styles.pickerBox, getReadonlyStyle()]}>
                    <Picker
                        selectedValue={appointmentType}
                        onValueChange={(itemValue) => !readonly && setAppointmentType(itemValue)}
                        enabled={!readonly}
                        style={[styles.picker, readonly && styles.readonlyText]}
                        dropdownIconColor={readonly ? theme.colours.textSecondary : "black"}
                        mode="dropdown"
                    >
                        {appointmentTypes.map((type) => (
                            <Picker.Item
                                key={type}
                                label={type}
                                value={type}
                                color={readonly ? theme.colours.textSecondary : "black"}
                            />
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
                    <View style={[styles.timeRow, getReadonlyStyle()]}>
                        <Text style={styles.timeLabel}>Starts</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* Start date button */}
                            <View style={[styles.datePickerWrapper, getReadonlyStyle()]}>
                                <DateTimePicker
                                    value={startDate.toDate()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => handleDateChange(event, date, true)}
                                    textColor={readonly ? theme.colours.textSecondary : theme.colours.textPrimary}
                                    themeVariant="light"
                                    style={{ marginLeft: -10 }}
                                    disabled={readonly}
                                />
                            </View>

                            {/* Start time button */}
                            <View style={[styles.timePickerWrapper, getReadonlyStyle()]}>
                                <DateTimePicker
                                    value={startDate.toDate()}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => handleTimeChange(event, date, true)}
                                    is24Hour={true}
                                    textColor={readonly ? theme.colours.textSecondary : theme.colours.textPrimary}
                                    minuteInterval={15}
                                    themeVariant="light"
                                    style={{ marginLeft: -10 }}
                                    disabled={readonly}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* End date/time section */}
                    <View style={[styles.timeRow, getReadonlyStyle()]}>
                        <Text style={styles.timeLabel}>Ends</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* End date button */}
                            <View style={[styles.datePickerWrapper, getReadonlyStyle()]}>
                                <DateTimePicker
                                    value={endDate.toDate()}
                                    mode="date"
                                    display="default"
                                    onChange={(event, date) => handleDateChange(event, date, false)}
                                    textColor={readonly ? theme.colours.textSecondary : theme.colours.textPrimary}
                                    themeVariant="light"
                                    style={{ marginLeft: -10 }}
                                    disabled={readonly}
                                />
                            </View>

                            {/* End time button */}
                            <View style={[styles.timePickerWrapper, getReadonlyStyle()]}>
                                <DateTimePicker
                                    value={endDate.toDate()}
                                    mode="time"
                                    display="default"
                                    onChange={(event, date) => handleTimeChange(event, date, false)}
                                    is24Hour={true}
                                    textColor={readonly ? theme.colours.textSecondary : theme.colours.textPrimary}
                                    minuteInterval={15}
                                    themeVariant="light"
                                    style={{ marginLeft: -10 }}
                                    disabled={readonly}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* Travel time section */}
                    <View style={[styles.timeRow, getReadonlyStyle()]}>
                        <Text style={styles.timeLabel}>Travel Time</Text>
                        <View style={styles.dateTimeContainer}>
                            <View style={[styles.timePickerWrapper, getReadonlyStyle()]}>
                                <DateTimePicker
                                    value={durationToDate(travelTime)}
                                    mode="time"
                                    display="default"
                                    onChange={handleTravelTimeChange}
                                    is24Hour={true}
                                    textColor={readonly ? theme.colours.textSecondary : theme.colours.textPrimary}
                                    minuteInterval={15}
                                    themeVariant="light"
                                    style={{ marginLeft: -10 }}
                                    disabled={readonly}
                                />
                            </View>
                        </View>
                    </View>
                </>
            );
        } else {
            return (
                <>
                    {/* Start date/time section */}
                    <View style={[styles.timeRow, getReadonlyStyle()]}>
                        <Text style={styles.timeLabel}>Starts</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* Start date button/display */}
                            {!readonly ? (
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowStartDate(true)}
                                >
                                    <Text style={styles.datePickerButtonText}>
                                        {formatDateForButton(startDate)}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.datePickerButton, styles.readonlyField]}>
                                    <Text style={[styles.datePickerButtonText, styles.readonlyText]}>
                                        {formatDateForButton(startDate)}
                                    </Text>
                                </View>
                            )}

                            {/* Start time button/display */}
                            {!readonly ? (
                                <TouchableOpacity
                                    style={styles.timePickerButton}
                                    onPress={() => setShowStartTime(true)}
                                >
                                    <Text style={styles.timePickerButtonText}>
                                        {formatTimeForButton(startDate)}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.timePickerButton, styles.readonlyField]}>
                                    <Text style={[styles.timePickerButtonText, styles.readonlyText]}>
                                        {formatTimeForButton(startDate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* End date/time section */}
                    <View style={[styles.timeRow, getReadonlyStyle()]}>
                        <Text style={styles.timeLabel}>Ends</Text>
                        <View style={styles.dateTimeContainer}>
                            {/* End date button/display */}
                            {!readonly ? (
                                <TouchableOpacity
                                    style={styles.datePickerButton}
                                    onPress={() => setShowEndDate(true)}
                                >
                                    <Text style={styles.datePickerButtonText}>
                                        {formatDateForButton(endDate)}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.datePickerButton, styles.readonlyField]}>
                                    <Text style={[styles.datePickerButtonText, styles.readonlyText]}>
                                        {formatDateForButton(endDate)}
                                    </Text>
                                </View>
                            )}

                            {/* End time button/display */}
                            {!readonly ? (
                                <TouchableOpacity
                                    style={styles.timePickerButton}
                                    onPress={() => setShowEndTime(true)}
                                >
                                    <Text style={styles.timePickerButtonText}>
                                        {formatTimeForButton(endDate)}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.timePickerButton, styles.readonlyField]}>
                                    <Text style={[styles.timePickerButtonText, styles.readonlyText]}>
                                        {formatTimeForButton(endDate)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.innerDivider} />

                    {/* Travel time section */}
                    <View style={[styles.timeRow, getReadonlyStyle()]}>
                        <Text style={styles.timeLabel}>Travel Time</Text>
                        <View style={styles.dateTimeContainer}>
                            {!readonly ? (
                                <TouchableOpacity
                                    style={styles.timePickerButton}
                                    onPress={() => setShowTravelTime(true)}
                                >
                                    <Text style={styles.timePickerButtonText}>
                                        {formatTravelTime(travelTime)}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={[styles.timePickerButton, styles.readonlyField]}>
                                    <Text style={[styles.timePickerButtonText, styles.readonlyText]}>
                                        {formatTravelTime(travelTime)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Render Android pickers when state is true and not readonly */}
                    {!readonly && showStartDate && (
                        <DateTimePicker
                            value={startDate.toDate()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => handleDateChange(event, date, true)}
                        />
                    )}

                    {!readonly && showStartTime && (
                        <DateTimePicker
                            value={startDate.toDate()}
                            mode="time"
                            display="default"
                            onChange={(event, date) => handleTimeChange(event, date, true)}
                            is24Hour={true}
                        />
                    )}

                    {!readonly && showEndDate && (
                        <DateTimePicker
                            value={endDate.toDate()}
                            mode="date"
                            display="default"
                            onChange={(event, date) => handleDateChange(event, date, false)}
                        />
                    )}

                    {!readonly && showEndTime && (
                        <DateTimePicker
                            value={endDate.toDate()}
                            mode="time"
                            display="default"
                            onChange={(event, date) => handleTimeChange(event, date, false)}
                            is24Hour={true}
                        />
                    )}

                    {!readonly && showTravelTime && (
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
        <Modal
            visible={visible}
            onClose={() => {
                resetFormState();
                onClose();
            }}
            title={title}
            leftButtonText={leftButtonText || 'Cancel'}
            rightButtonText={rightButtonText || 'Save'}
            onLeftButtonPress={handleCancel}
            onRightButtonPress={handleSave}
            backgroundColor={backgroundColor || undefined}
        >
            <ScrollView style={styles.container}
                showsVerticalScrollIndicator={true}
            >
                {/* Input fields container */}
                <View style={[styles.mergedContainer, getReadonlyStyle()]}>
                    <View style={styles.mergedContainerContent}>
                        <InputField
                            value={provider}
                            onChangeText={setProvider}
                            placeholder="Provider (Hospital/Clinic)"
                            editable={!readonly}
                            style={{
                                input: [styles.input, getReadonlyStyle()],
                            }}
                        />

                        <View style={styles.innerDivider} />

                        <InputField
                            value={staff}
                            onChangeText={setStaff}
                            placeholder="Staff/Doctor"
                            editable={!readonly}
                            style={{
                                input: [styles.input, getReadonlyStyle()],
                            }}
                        />

                        <View style={styles.innerDivider} />

                        <InputField
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Description/Purpose"
                            multiline
                            editable={!readonly}
                            style={{
                                input: [styles.descriptionInput, getReadonlyStyle()],
                            }}
                        />
                    </View>
                </View>

                {/* Time settings container */}
                <View style={styles.mergedContainer}>
                    <View style={styles.mergedContainerContent}>
                        {renderDateTimePickers()}
                    </View>
                </View>

                {/* Appointment Type */}
                <View style={[styles.pickerContainer, getReadonlyStyle()]}>
                    <Text style={[styles.pickerLabel, readonly && styles.readonlyText]}>Appointment Type</Text>
                    {renderPicker()}
                </View>

                {/*Notes section*/}
                <View style={[styles.mergedContainer, getReadonlyStyle()]}>
                    <View style={styles.mergedContainerContent}>
                        <InputField
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Notes"
                            multiline
                            editable={!readonly}
                            style={{
                                input: [styles.descriptionInput, { minHeight: 100 }, getReadonlyStyle()],
                            }}
                        />
                    </View>
                </View>

                {title === "Edit" && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => {
                            if (readonly) return;

                            Alert.alert(
                                "Confirm Deletion",
                                "Are you sure you want to delete this appointment?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { text: "Delete", style: "destructive", onPress: onDeleteAppointment }
                                ]
                            );
                        }}
                    >
                        <Text style={styles.deleteButtonText}>Delete Appointment</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </Modal>
    );
};

const shadowStyle = Platform.select({
    ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    android: {
        elevation: 4,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    mergedContainer: {
        backgroundColor: theme.colours.surface,
        borderRadius: 10,
        marginVertical: 10,
        marginHorizontal: 10,
        ...shadowStyle,
    },
    mergedContainerContent: {
        overflow: 'hidden',
        borderRadius: 10,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        backgroundColor: theme.colours.surface,
        borderRadius: 6,
    },
    timePickerWrapper: {
        marginLeft: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                backgroundColor: theme.colours.surface,
                borderRadius: 6,
            },
        }),
    },
    datePickerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: theme.colours.blue80,
        marginRight: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                // Add space for shadow
                marginBottom: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    timePickerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: theme.colours.blue80,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                marginBottom: 2,
            },
            android: {
                elevation: 2,
            },
        }),
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
                justifyContent: 'space-between',
                paddingLeft: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
            },
            android: {
                height: 110,
                elevation: 4,
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
        backgroundColor: theme.colours.gray90,
        borderRadius: 8,
        alignItems: 'flex-end',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
            },
        }),
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
        backgroundColor: theme.colours.gray90,
        borderRadius: 8,
        paddingBottom: 5,
        margin: 10,
        marginVertical: 0,
        ...Platform.select({
            android: {
                elevation: 2,
            },
        }),
    },
    // New styles for readonly mode
    readonlyField: {
        backgroundColor: theme.colours.gray50,
        opacity: 0.9,
    },
    readonlyText: {
        color: theme.colours.textSecondary,
    },
    // Delete button styles
    deleteButton: {
        backgroundColor: theme.colours.primary,
        marginHorizontal: 10,
        marginBottom: 20,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        ...shadowStyle,
    },
    deleteButtonText: {
        color: 'white',
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 16,
    },
});

export default AppointmentForm;
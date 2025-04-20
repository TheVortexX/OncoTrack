import React, { useState, useEffect } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import InputField from '@/components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from '@/components/modal';
import moment from 'moment';
import { theme } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    units: string;
    instructedDosage?: string;
    instructions?: string;

    [key: string]: any;
}

interface MedicationLog {
    medicationId: string;
    name: string;
    dosage: string;
    unit: string;
    time: moment.Moment;
    notes?: string;
    instructedDosage?: string;
    instructions?: string;
    [key: string]: any;
}

interface MedicationLogFormProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    leftButtonText?: string;
    rightButtonText?: string;
    onLeftButtonPress?: () => void;
    onRightButtonPress?: (logEntry: MedicationLog) => void;
    backgroundColor?: string;
    medication: Medication | null;
    timeOfDay: string;
}

const MedicationLogForm: React.FC<MedicationLogFormProps> = ({
    visible,
    onClose,
    title,
    leftButtonText,
    rightButtonText,
    onLeftButtonPress,
    onRightButtonPress,
    backgroundColor,
    medication,
    timeOfDay,
}) => {
    const [medicationName, setMedicationName] = useState('');
    const [dosage, setDosage] = useState('1');
    const [instructedDosage, setInstructedDosage] = useState('');
    const [instructions, setInstructions] = useState('');
    const [notes, setNotes] = useState('');
    const [logDate, setLogDate] = useState(moment());
    const [logTime, setLogTime] = useState(moment());

    // State for showing/hiding date/time pickers
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (visible) {
            resetFormState();
        }
    }, [medication, visible]);

    const resetFormState = () => {
        if (medication) {
            setMedicationName(medication.name || '');
            setDosage(medication.dosage || '1');
            setInstructedDosage(medication.dosage + " " + medication.units || '');
            setInstructions(medication.instructions || '');
        } else {
            setMedicationName('');
            setDosage('1');
            setInstructedDosage('');
            setInstructions('');
        }
        setNotes('');
        setLogDate(moment());
        setLogTime(moment());
    };

    const handleSave = () => {
        if (!medicationName.trim()) {
            Alert.alert("Error", "Medication name is required");
            return;
        }

        if (!dosage.trim()) {
            Alert.alert("Error", "Dosage is required");
            return;
        }

        const logEntry: MedicationLog = {
            medicationId: medication?.id || '',
            name: medicationName,
            dosage,
            unit: medication?.units || 'mg',
            time: logDate,
            notes: notes.trim() || undefined,
            instructedDosage: instructedDosage.trim() || undefined,
            instructions: instructions.trim() || undefined,
            timeOfDay: timeOfDay,
        };

        onRightButtonPress && onRightButtonPress(logEntry);
    };

    const handleCancel = () => {
        resetFormState();
        onLeftButtonPress && onLeftButtonPress();
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');

        if (selectedDate) {
            const selectedMoment = moment(selectedDate);
            setLogDate(selectedMoment);
        }
    };

    const handleTimeChange = (event: any, selectedTime?: Date) => {
        setShowTimePicker(Platform.OS === 'ios');

        if (selectedTime) {
            const selectedMoment = moment(selectedTime);
            setLogTime(selectedMoment);
        }
    };

    const formatDateForDisplay = (date: moment.Moment): string => {
        return date.format('ddd, MMM DD, YYYY');
    };

    const formatTimeForDisplay = (time: moment.Moment): string => {
        return time.format('h:mm A');
    };

    const increaseDosage = () => {
        const currentDosage = parseInt(dosage) || 0;
        setDosage((currentDosage + 1).toString());
    };

    const decreaseDosage = () => {
        const currentDosage = parseInt(dosage) || 0;
        if (currentDosage > 1) {
            setDosage((currentDosage - 1).toString());
        }
    };

    return (
        <Modal
            visible={visible}
            onClose={() => {
                resetFormState();
                onClose();
            }}
            title={title || 'Log Medication'}
            leftButtonText={leftButtonText || 'Cancel'}
            rightButtonText={rightButtonText || 'Log'}
            onLeftButtonPress={handleCancel}
            onRightButtonPress={handleSave}
            backgroundColor={backgroundColor || undefined}
        >
            <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
                {/* Medication Instruction Section */}
                <View style={styles.mergedContainer}>
                    <View style={styles.mergedContainerContent}>
                        <Text style={styles.fieldLabel}>Medication Name</Text>
                        <View style={[styles.input]}>
                            <Text style={styles.readonlyText}>{medicationName}</Text>
                        </View>

                        <View style={styles.innerDivider} />

                        <Text style={styles.fieldLabel}>Instructed Dosage</Text>
                        <View style={[styles.input]}>
                            <Text style={styles.readonlyText}>{instructedDosage || 'Not specified'}</Text>
                        </View>

                        <View style={styles.innerDivider} />

                        <Text style={styles.fieldLabel}>Instructions</Text>
                        <View style={[styles.input, styles.instructionsInput]}>
                            <Text style={styles.readonlyText}>{instructions || 'No instructions provided'}</Text>
                        </View>
                    </View>
                </View>

                {/* Dosage Input */}
                <View style={styles.mergedContainer}>
                    <View style={styles.mergedContainerContent}>
                        <Text style={styles.fieldLabel}>Dosage taken</Text>
                        <View style={styles.dosageContainer}>
                            <TouchableOpacity
                                style={styles.dosageButton}
                                onPress={decreaseDosage}
                            >
                                <Text style={styles.dosageButtonText}>-</Text>
                            </TouchableOpacity>

                            <InputField
                                value={dosage}
                                onChangeText={setDosage}
                                placeholder="Dosage"
                                keyboardType="numeric"
                                returnKeyType='done'
                                style={{
                                    container: styles.dosageValueContainer,
                                    input: styles.dosageValue,

                                }}
                            />

                            <TouchableOpacity
                                style={styles.dosageButton}
                                onPress={increaseDosage}
                            >
                                <Text style={styles.dosageButtonText}>+</Text>
                            </TouchableOpacity>

                            <View style={styles.unitContainer}>
                                <Text style={styles.unitText}>{medication?.units || 'mg'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.mergedContainer}>
                    <View style={styles.mergedContainerContent}>
                        {/* Date picker */}
                        <View style={styles.dateTimeRow}>
                            <Text style={styles.fieldLabel}>Date</Text>

                            {Platform.OS === 'ios' ? (
                                <View style={styles.datePickerWrapper}>
                                    <DateTimePicker
                                        value={logDate.toDate()}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                        textColor={theme.colours.textPrimary}
                                        themeVariant="light"
                                        style={{ marginLeft: -10 }}
                                    />
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.dateTimeButton}
                                        onPress={() => setShowDatePicker(true)}
                                    >
                                        <Text style={styles.dateTimeButtonText}>
                                            {formatDateForDisplay(logDate)}
                                        </Text>
                                        <MaterialCommunityIcons name="calendar" size={20} color={theme.colours.textSecondary} />
                                    </TouchableOpacity>

                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={logDate.toDate()}
                                            mode="date"
                                            display="default"
                                            onChange={handleDateChange}
                                        />
                                    )}
                                </>
                            )}
                        </View>

                        <View style={styles.innerDivider} />

                        {/* Time picker */}
                        <View style={styles.dateTimeRow}>
                            <Text style={styles.fieldLabel}>Time</Text>

                            {Platform.OS === 'ios' ? (
                                <View style={styles.datePickerWrapper}>
                                    <DateTimePicker
                                        value={logTime.toDate()}
                                        mode="time"
                                        display="default"
                                        onChange={handleTimeChange}
                                        textColor={theme.colours.textPrimary}
                                        themeVariant="light"
                                        style={{ marginLeft: -10 }}
                                    />
                                </View>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={styles.dateTimeButton}
                                        onPress={() => setShowTimePicker(true)}
                                    >
                                        <Text style={styles.dateTimeButtonText}>
                                            {formatTimeForDisplay(logTime)}
                                        </Text>
                                        <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colours.textSecondary} />
                                    </TouchableOpacity>

                                    {showTimePicker && (
                                        <DateTimePicker
                                            value={logTime.toDate()}
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

                {/* Notes */}
                <View style={styles.mergedContainer}>
                    <View style={styles.mergedContainerContent}>
                        <Text style={styles.fieldLabel}>Notes</Text>
                        <InputField
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Add any notes about this dose (optional)"
                            multiline={true}
                            style={{
                                input: styles.notesInput,
                            }}
                        />
                    </View>
                </View>

                {/* Additional information section */}
                <View style={styles.infoContainer}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={theme.colours.textSecondary} />
                    <Text style={styles.infoText}>
                        This log will be added to your medication history and can help track your adherence.
                    </Text>
                </View>
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
        marginVertical: 8,
        marginHorizontal: 10,
        ...shadowStyle,
    },
    mergedContainerContent: {
        overflow: 'hidden',
        borderRadius: 10,
        padding: 12,
    },
    fieldLabel: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: normaliseSize(16),
        color: theme.colours.textPrimary,
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 50,
        paddingHorizontal: 10,
        backgroundColor: theme.colours.surface,
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
        borderWidth: 1,
        borderColor: theme.colours.lightGray,
        borderRadius: 8,
        justifyContent: 'center',
    },
    instructionsInput: {
        minHeight: 60,
        height: 'auto',
        paddingVertical: 10,
    },
    readonlyText: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    notesInput: {
        width: '100%',
        minHeight: 80,
        paddingHorizontal: 10,
        paddingTop: 10,
        backgroundColor: theme.colours.surface,
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
        borderWidth: 1,
        borderColor: theme.colours.lightGray,
        borderRadius: 8,
        textAlignVertical: 'top',
    },
    innerDivider: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.lightGray,
        marginVertical: 12,
    },
    dateTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    datePickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 2,
        backgroundColor: theme.colours.surface,
    },
    dateTimeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: theme.colours.gray90,
        ...shadowStyle,
    },
    dateTimeButtonText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: normaliseSize(16),
        color: theme.colours.textPrimary,
        marginRight: 8,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: theme.colours.gray90,
        borderRadius: 8,
        padding: 12,
        margin: 10,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: normaliseSize(14),
        color: theme.colours.textSecondary,
    },
    readonlyField: {
        backgroundColor: theme.colours.surface,
        borderWidth: 1,
        borderColor: theme.colours.lightGray,
    },
    dosageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: theme.colours.lightGray,
        borderRadius: 8,
        overflow: 'hidden',
    },
    dosageButton: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.gray90,
    },
    dosageButtonText: {
        fontSize: normaliseSize(24),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.textPrimary,
    },
    dosageValueContainer: {
        flex: 1,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.surface,
    },
    dosageValue: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
        textAlign: 'center',
        paddingTop: 15
    },
    unitContainer: {
        height: '100%',
        paddingHorizontal: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.gray90,
        borderLeftWidth: 1,
        borderLeftColor: theme.colours.lightGray,
    },
    unitText: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
});

export default MedicationLogForm;
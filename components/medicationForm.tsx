import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, Switch } from 'react-native';
import InputField from '@/components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from '@/components/modal';
import PickerModal from '@/components/iosPicker';
import moment from 'moment';
import { theme } from '@/constants/theme';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    units: string;
    frequency: string;
    startDate: moment.Moment;
    endDate?: moment.Moment;
    timeOfDay: string[];
    instructions: string;
    sideEffects?: string[];
    [key: string]: any;
}

interface MedicationFormProps {
    readonly?: boolean;
    existingMedication?: Medication | null;
    visible: boolean;
    onClose: () => void;
    title?: string;
    leftButtonText?: string;
    rightButtonText?: string;
    onLeftButtonPress?: () => void;
    onRightButtonPress?: ({ }) => void;
    backgroundColor?: string;
}

const MedicationForm: React.FC<MedicationFormProps> = ({
    existingMedication,
    visible,
    onClose,
    title,
    leftButtonText,
    rightButtonText,
    onLeftButtonPress,
    onRightButtonPress,
    backgroundColor,
    readonly = false,
}) => {
    const originalMedicationRef = useRef<Medication | null | undefined>(null);

    const [name, setName] = useState('');
    const [dosage, setDosage] = useState('1');
    const [units, setUnits] = useState('mg');
    const [frequency, setFrequency] = useState('Daily');
    const [instructions, setInstructions] = useState('');
    const [startDate, setStartDate] = useState(moment());
    const [endDate, setEndDate] = useState<moment.Moment | undefined>(undefined);
    const [hasEndDate, setHasEndDate] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState<string[]>([]);
    const [sideEffects, setSideEffects] = useState<string[]>([]);
    const [newSideEffect, setNewSideEffect] = useState('');

    // State for showing/hiding date pickers
    const [showUnitsPicker, setShowUnitsPicker] = useState(false);
    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

    // TODO prompt when one,two,three times a day is selected the correct amount of reminder times is selected also
    const frequencyOptions = ['Daily', 'Twice Daily', 'Three Times Daily', 'Every Other Day', 'Every Three Days', 'Weekly', 'Monthly', 'As Needed', 'Other'];
    const timeOfDayOptions = ['morning', 'afternoon', 'evening'];
    const unitsOptions = ['mg', 'ml', 'tablet', 'capsule', 'drop', 'tsp', 'tbsp', 'patch', 'puff', 'injection'];


    const increaseDosage = () => {
        if (readonly) return;
        const currentDosage = parseInt(dosage) || 0;
        setDosage((currentDosage + 1).toString());
    };

    const decreaseDosage = () => {
        if (readonly) return;
        const currentDosage = parseInt(dosage) || 0;
        if (currentDosage > 1) {
            setDosage((currentDosage - 1).toString());
        }
    };

    const saveOriginalMedication = (medication?: Medication | null) => {
        if (!medication) {
            originalMedicationRef.current = null;
            return;
        }

        originalMedicationRef.current = {
            ...medication,
            startDate: moment(medication.startDate),
            endDate: medication.endDate ? moment(medication.endDate) : undefined,
        };
    };

    const resetFormState = () => {
        const original = originalMedicationRef.current;

        if (original) {
            setName(original.name);
            setDosage(original.dosage);
            setUnits(original.units || 'mg');
            setFrequency(original.frequency);
            setInstructions(original.instructions);
            setStartDate(moment(original.startDate));
            setEndDate(original.endDate ? moment(original.endDate) : undefined);
            setHasEndDate(!!original.endDate);
            setTimeOfDay(original.timeOfDay || []);
            setSideEffects(original.sideEffects || []);
            setNewSideEffect('');
        } else {
            setName('');
            setDosage('1');
            setUnits('mg');
            setFrequency('Daily');
            setInstructions('');
            setStartDate(moment());
            setEndDate(undefined);
            setHasEndDate(false);
            setTimeOfDay([]);
            setSideEffects([]);
            setNewSideEffect('');
        }
    };

    useEffect(() => {
        if (visible) {
            saveOriginalMedication(existingMedication);
            resetFormState();
        }
    }, [existingMedication, visible]);

    const handleSave = () => {
        if (!name.trim()) {
            Alert.alert("Error", "Medication name is required");
            return;
        }

        if (!dosage.trim()) {
            Alert.alert("Error", "Dosage is required");
            return;
        }

        const newMedication: Medication = {
            id: existingMedication?.id || "temp-med-id",
            name,
            dosage,
            units,
            frequency,
            startDate,
            endDate: hasEndDate ? endDate : undefined,
            timeOfDay,
            instructions,
            sideEffects,
        };

        onRightButtonPress && onRightButtonPress(newMedication);
    };

    const handleCancel = () => {
        resetFormState();
        onLeftButtonPress && onLeftButtonPress();
    };

    const handleTimeOfDayToggle = (time: string) => {
        if (readonly) return;

        setTimeOfDay(prev => {
            if (prev.includes(time)) {
                return prev.filter(t => t !== time);
            } else {
                return [...prev, time];
            }
        });
    };

    const handleAddSideEffect = () => {
        if (!newSideEffect.trim() || readonly) return;

        setSideEffects(prev => [...prev, newSideEffect.trim()]);
        setNewSideEffect('');
    };

    const handleRemoveSideEffect = (index: number) => {
        if (readonly) return;

        setSideEffects(prev => prev.filter((_, i) => i !== index));
    };

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
            setStartDate(newMoment);

            // If end date is before start date, update it
            if (endDate && endDate.isBefore(newMoment)) {
                setEndDate(newMoment.clone().add(30, 'days'));
            }
        } else {
            setEndDate(newMoment);
        }
    };

    const formatDateForButton = (date: moment.Moment): string => {
        return date.format('ddd, MMM DD, YYYY');
    };

    const pickerItems = frequencyOptions.map(option => ({
        label: option,
        value: option
    }));

    // Get styles for readonly fields
    const getReadonlyStyle = () => {
        return readonly ? {
            backgroundColor: theme.colours.gray90,
            color: theme.colours.textSecondary,
        } : {};
    };

    // Platform-specific picker rendering
    const renderFrequencyPicker = () => {
        if (Platform.OS === 'ios') {
            return (
                <TouchableOpacity
                    onPress={() => !readonly && setShowFrequencyPicker(true)}
                    disabled={readonly}
                    style={[styles.iosPickerButton, getReadonlyStyle()]}
                >
                    <Text style={[styles.iosPickerText, readonly && styles.readonlyText]}>
                        {frequency}
                    </Text>

                    <PickerModal
                        isVisible={showFrequencyPicker && !readonly}
                        onClose={() => setShowFrequencyPicker(false)}
                        onConfirm={(value) => setFrequency(value)}
                        value={frequency}
                        items={pickerItems}
                        title="Medication Frequency"
                    />
                </TouchableOpacity>
            );
        } else {
            return (
                <View style={[styles.pickerBox, getReadonlyStyle()]}>
                    <Picker
                        selectedValue={frequency}
                        onValueChange={(itemValue) => !readonly && setFrequency(itemValue)}
                        enabled={!readonly}
                        style={[styles.picker, readonly && styles.readonlyText]}
                        dropdownIconColor={readonly ? theme.colours.textSecondary : "black"}
                        mode="dropdown"
                    >
                        {frequencyOptions.map((option) => (
                            <Picker.Item
                                key={option}
                                label={option}
                                value={option}
                                color={readonly ? theme.colours.textSecondary : "black"}
                            />
                        ))}
                    </Picker>
                </View>
            );
        }
    };
    
    const renderUnitsPicker = () => {
        if (Platform.OS === 'ios') {
            return (
                <View style={styles.unitContainer}>
                    <TouchableOpacity
                        onPress={() => !readonly && setShowUnitsPicker(true)}
                        disabled={readonly}
                    >
                        <Text style={styles.unitText}>{units}</Text>
                    </TouchableOpacity>

                    <PickerModal
                        isVisible={showUnitsPicker && !readonly}
                        onClose={() => setShowUnitsPicker(false)}
                        onConfirm={(value) => setUnits(value)}
                        value={units}
                        items={unitsOptions.map(option => ({
                            label: option,
                            value: option
                        }))}
                        title="Dosage Units"
                    />
                </View>
            );
        } else {
            return (
                <View style={styles.unitContainer}>
                    <TouchableOpacity
                        onPress={() => !readonly && setShowUnitsPicker(true)}
                        disabled={readonly}
                    >
                        <Text style={styles.unitText}>{units}</Text>
                    </TouchableOpacity>

                    {showUnitsPicker && !readonly && (
                        <Picker
                            selectedValue={units}
                            onValueChange={(itemValue) => {
                                setUnits(itemValue);
                                setShowUnitsPicker(false);
                            }}
                            mode="dropdown"
                            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colours.surface }}
                        >
                            {unitsOptions.map((option) => (
                                <Picker.Item
                                    key={option}
                                    label={option}
                                    value={option}
                                    color="black"
                                />
                            ))}
                        </Picker>
                    )}
                </View>
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
            <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
                {/* Basic medication info */}
                <View style={[styles.mergedContainer, getReadonlyStyle()]}>
                    <View style={styles.mergedContainerContent}>
                        <InputField
                            value={name}
                            onChangeText={setName}
                            placeholder="Medication Name"
                            editable={!readonly}
                            style={{
                                input: [styles.input, getReadonlyStyle()],
                            }}
                        />

                        <View style={styles.innerDivider} />

                        <Text style={[styles.sectionTitle, readonly && styles.readonlyText]}>Dosage</Text>
                        <View style={styles.dosageContainer}>
                            <TouchableOpacity
                                style={[styles.dosageButton, readonly && styles.readonlyField]}
                                onPress={decreaseDosage}
                                disabled={readonly}
                            >
                                <Text style={styles.dosageButtonText}>-</Text>
                            </TouchableOpacity>

                            <InputField
                                value={dosage}
                                onChangeText={setDosage}
                                placeholder="Dosage"
                                keyboardType="numeric"
                                returnKeyType='done'
                                editable={!readonly}
                                style={{
                                    container: [styles.dosageValueContainer, getReadonlyStyle()],
                                    input: [styles.dosageValue, readonly && getReadonlyStyle()],
                                }}
                            />

                            <TouchableOpacity
                                style={[styles.dosageButton, readonly && styles.readonlyField]}
                                onPress={increaseDosage}
                                disabled={readonly}
                            >
                                <Text style={styles.dosageButtonText}>+</Text>
                            </TouchableOpacity>
                            {renderUnitsPicker()}
                        </View>

                        <View style={styles.innerDivider} />

                        <InputField
                            value={instructions}
                            onChangeText={setInstructions}
                            placeholder="Instructions (e.g., Take with food)"
                            multiline
                            editable={!readonly}
                            style={{
                                input: [styles.descriptionInput, getReadonlyStyle()],
                            }}
                        />
                    </View>
                </View>

                {/* Frequency picker */}
                <View style={[styles.pickerContainer, getReadonlyStyle()]}>
                    <Text style={[styles.pickerLabel, readonly && styles.readonlyText]}>Frequency</Text>
                    {renderFrequencyPicker()}
                </View>

                {/* Time of day options */}
                <View style={[styles.mergedContainer, getReadonlyStyle()]}>
                    <View style={styles.mergedContainerContent}>
                        <Text style={[styles.sectionTitle, readonly && styles.readonlyText]}>
                            Time of Day
                        </Text>
                        <View style={styles.timeOfDayContainer}>
                            {timeOfDayOptions.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeOfDayItem,
                                        timeOfDay.includes(time) && (readonly ? styles.timeOfDayItemReadonlySelected : styles.timeOfDayItemSelected),
                                        readonly && !timeOfDay.includes(time) && styles.readonlyField
                                    ]}
                                    onPress={() => handleTimeOfDayToggle(time)}
                                    disabled={readonly}
                                >
                                    <MaterialCommunityIcons
                                        name={
                                            time === 'morning'
                                                ? 'weather-sunny'
                                                : time === 'afternoon'
                                                    ? 'weather-partly-cloudy'
                                                    : 'weather-night'
                                        }
                                        size={24}
                                        color={
                                            timeOfDay.includes(time)
                                                ? theme.colours.white
                                                : theme.colours.textSecondary
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.timeOfDayText,
                                            timeOfDay.includes(time) && styles.timeOfDayTextSelected,
                                            readonly && [styles.readonlyText],
                                            timeOfDay.includes(time) && readonly && { color: theme.colours.white },

                                        ]}
                                    >
                                        {time.charAt(0).toUpperCase() + time.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Start and end dates */}
                <View style={[styles.mergedContainer, getReadonlyStyle()]}>
                    <View style={styles.mergedContainerContent}>
                        <View style={styles.dateRow}>
                            <Text style={[styles.dateLabel, readonly && styles.readonlyText]}>Start Date</Text>

                            {Platform.OS === 'ios' ? (
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
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={[styles.dateButton, readonly && styles.readonlyField]}
                                        onPress={() => !readonly && setShowStartDate(true)}
                                        disabled={readonly}
                                    >
                                        <Text style={[styles.dateButtonText, readonly && styles.readonlyText]}>
                                            {formatDateForButton(startDate)}
                                        </Text>
                                    </TouchableOpacity>

                                    {showStartDate && !readonly && (
                                        <DateTimePicker
                                            value={startDate.toDate()}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => handleDateChange(event, date, true)}
                                        />
                                    )}
                                </>
                            )}
                        </View>

                        <View style={styles.innerDivider} />

                        {/* End date toggle and picker */}
                        <View style={styles.dateRow}>
                            <View style={styles.endDateToggleRow}>
                                <Text style={[styles.dateLabel, readonly && styles.readonlyText]}>End Date</Text>
                                <Switch
                                    value={hasEndDate}
                                    onValueChange={(value) => {
                                        if (!readonly) {
                                            setHasEndDate(value);
                                        }
                                    }}
                                    disabled={readonly}
                                    trackColor={{ false: theme.colours.lightGray, true: theme.colours.primaryLight50 }}
                                    thumbColor={hasEndDate ? theme.colours.primary : theme.colours.gray90}
                                />
                            </View>

                            {hasEndDate && (
                                Platform.OS === 'ios' ? (
                                    <View style={[styles.datePickerWrapper, getReadonlyStyle()]}>
                                        <DateTimePicker
                                            value={(endDate || moment().add(30, 'days')).toDate()}
                                            mode="date"
                                            display="default"
                                            onChange={(event, date) => handleDateChange(event, date, false)}
                                            textColor={readonly ? theme.colours.textSecondary : theme.colours.textPrimary}
                                            themeVariant="light"
                                            style={{ marginLeft: -10 }}
                                            disabled={readonly}
                                        />
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.dateButton, readonly && styles.readonlyField]}
                                            onPress={() => !readonly && setShowEndDate(true)}
                                            disabled={readonly}
                                        >
                                            <Text style={[styles.dateButtonText, readonly && styles.readonlyText]}>
                                                {formatDateForButton(endDate || moment().add(30, 'days'))}
                                            </Text>
                                        </TouchableOpacity>

                                        {showEndDate && !readonly && (
                                            <DateTimePicker
                                                value={(endDate || moment().add(30, 'days')).toDate()}
                                                mode="date"
                                                display="default"
                                                onChange={(event, date) => handleDateChange(event, date, false)}
                                            />
                                        )}
                                    </>
                                )
                            )}
                        </View>
                    </View>
                </View>

                {/* Side effects section */}
                <View style={[styles.mergedContainer, getReadonlyStyle()]}>
                    <View style={styles.mergedContainerContent}>
                        <Text style={[styles.sectionTitle, readonly && styles.readonlyText]}>
                            Side Effects
                        </Text>

                        {/* List of current side effects */}
                        {sideEffects.length > 0 ? (
                            <View style={styles.sideEffectsList}>
                                {sideEffects.map((effect, index) => (
                                    <View key={index} style={styles.sideEffectItem}>
                                        <Text style={styles.sideEffectText}>{effect}</Text>
                                        {!readonly && (
                                            <TouchableOpacity
                                                onPress={() => handleRemoveSideEffect(index)}
                                                style={styles.removeSideEffectButton}
                                            >
                                                <MaterialCommunityIcons name="close" size={20} color={theme.colours.textSecondary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.noSideEffectsText}>
                                No side effects recorded
                            </Text>
                        )}

                        {/* Add new side effect */}
                        {!readonly && (
                            <View style={styles.addSideEffectContainer}>
                                <View style={styles.sideEffectInputWrapper}>
                                    <InputField
                                        value={newSideEffect}
                                        onChangeText={setNewSideEffect}
                                        placeholder="Add a side effect"
                                        editable={!readonly}
                                        style={{
                                            container: styles.sideEffectInputContainer,
                                            input: [styles.input, styles.sideEffectInput],
                                        }}
                                    />
                                </View>
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={styles.addSideEffectButton}
                                        onPress={handleAddSideEffect}
                                    >
                                        <MaterialCommunityIcons name="plus" size={24} color={theme.colours.white} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
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
        marginVertical: 10,
        marginHorizontal: 10,
        ...shadowStyle,
    },
    mergedContainerContent: {
        overflow: 'hidden',
        borderRadius: 10,
        padding: 10,
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
    sectionTitle: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        color: theme.colours.textPrimary,
        marginVertical: 10,
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
    timeOfDayContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    timeOfDayItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginHorizontal: 5,
        borderRadius: 8,
        backgroundColor: theme.colours.gray90,
    },
    timeOfDayItemSelected: {
        backgroundColor: theme.colours.primary,
    },
    timeOfDayItemReadonlySelected: {
        backgroundColor: theme.colours.darkBlueGray,
    },
    timeOfDayText: {
        marginTop: 5,
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 14,
        color: theme.colours.textSecondary,
    },
    timeOfDayTextSelected: {
        color: theme.colours.white,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
    },
    endDateToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateLabel: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        color: theme.colours.textPrimary,
        marginRight: 10,
    },
    datePickerWrapper: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        backgroundColor: theme.colours.surface,
        borderRadius: 6,
    },
    dateButton: {
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
    dateButtonText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textPrimary,
    },
    sideEffectsList: {
        marginTop: 10,
    },
    sideEffectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: theme.colours.gray90,
        borderRadius: 8,
        marginBottom: 8,
    },
    sideEffectText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textPrimary,
        flex: 1,
    },
    removeSideEffectButton: {
        padding: 5,
    },
    noSideEffectsText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 15,
    },
    addSideEffectContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 5,
    },
    sideEffectInputContainer: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colours.lightGray,
        borderRadius: 8,
        backgroundColor: theme.colours.surface,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    sideEffectInput: {
        height: 46,
        paddingHorizontal: 10,
        paddingVertical: 0,
        fontSize: 16,
    },
    sideEffectInputWrapper: {
        flex: 1,
    },
    buttonContainer: {
        height: 46,
        marginLeft: 10,
    },
    addSideEffectButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: theme.colours.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    readonlyField: {
        backgroundColor: theme.colours.gray80,
        opacity: 0.9,
    },
    readonlyText: {
        color: theme.colours.textSecondary,
    },
    dosageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderWidth: 1,
        borderColor: theme.colours.lightGray,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 10,
    },
    dosageButton: {
        width: 50,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.gray90,
    },
    dosageButtonText: {
        fontSize: 24,
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
        fontSize: 16,
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
        fontSize: 16,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
});

export default MedicationForm;
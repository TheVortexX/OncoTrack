import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import moment from 'moment';
import { Timestamp } from 'firebase/firestore';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getUserMedications, saveMedication, updateMedication, deleteMedication, logMedicationAdherence } from '@/services/medicationService';
import MedicationForm from '@/components/medicationForm';
import MedicationLogForm from '@/components/medicationLogForm';
import { momentToTimestamp, timestampToMoment } from '@/utils/dateUtils';

// TODO: add notifications

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
    colour?: string;
    [key: string]: any;
}

interface MedicationsMap {
    [id: string]: Medication;
}

const MedicationScreen = () => {
    const [medications, setMedications] = useState<MedicationsMap>({});
    const [showMedicationModal, setShowMedicationModal] = useState(false);
    const [showLoggingMedicationModal, setShowLogMedicationModal] = useState(false);

    // Modal params
    const [modalTitle, setModalTitle] = useState('New');
    const [readonly, setReadonly] = useState(false);
    const [rightButtonText, setRightButtonText] = useState('Add');
    const [rightButtonAction, setRightButtonAction] = useState(() => (_: any) => { });
    const [existingMedication, setExistingMedication] = useState<Medication | null>(null);
    const [timeOfDay, setTimeOfDay] = useState('morning');

    const { user } = useAuth();

    // load medications from Firebase
    useFocusEffect(
        useCallback(() => {
            if (!user) return;

            getUserMedications(user.uid).then((medicationDocs) => {
                const newMedicationsMap: MedicationsMap = {};

                medicationDocs.forEach((doc) => {
                    const data = doc.data();
                    const id = doc.id;

                    newMedicationsMap[id] = {
                        ...data,
                        id,
                        name: data.name || '',
                        dosage: data.dosage || '',
                        units: data.units || '',
                        frequency: data.frequency || '',
                        startDate: data.startDate ? timestampToMoment(data.startDate) : moment(),
                        endDate: data.endDate ? timestampToMoment(data.endDate) : undefined,
                        timeOfDay: data.timeOfDay || [],
                        instructions: data.instructions || '',
                        sideEffects: data.sideEffects || [],
                        colour: getMedicationColour(data.name),
                    };
                });

                setMedications(newMedicationsMap);
            });
        }, [user])
    );

    const showNewMedicationModal = () => {
        setRightButtonAction(() => {
            return (newMedication: any) => {
                addNewMedication(newMedication as Medication);
                setShowMedicationModal(false);
            };
        });

        setExistingMedication(null);
        setModalTitle('New');
        setReadonly(false);
        setRightButtonText('Add');
        setShowMedicationModal(true);
    };

    const showEditMedicationModal = (medication: Medication) => {
        setExistingMedication(medication);

        setRightButtonAction(() => {
            return (updatedMedication: any) => {
                editMedication(updatedMedication as Medication);
                setShowMedicationModal(false);
            };
        });

        setModalTitle('Edit');
        setReadonly(false);
        setRightButtonText('Save');
        setShowMedicationModal(true);
    };

    const showViewMedicationModal = (medication: Medication) => {
        setExistingMedication(medication);

        setRightButtonAction(() => {
            return (med: any) => {
                showEditMedicationModal(medication);
            };
        });

        setModalTitle(' ');
        setReadonly(true);
        setRightButtonText('Edit');
        setShowMedicationModal(true);
    };

    const showLogMedicationModal = (medication: Medication, timeOfDay: string) => {
        setExistingMedication(medication);
        setTimeOfDay(timeOfDay);
        setShowLogMedicationModal(true);
    }
    
    const handleLogMedication = (log: any) => {
        if (!user) return;
        
        const medicationToLog = {
            medicationId: log.medicationId,
            provider: log.name,
            staff: "Medication taken",
            description: `Took ${log.dosage} ${log.unit}`,
            startTime: momentToTimestamp(log.time),
            endTime: momentToTimestamp(log.time),
            appointmentType: "Medication Log",
            timeofDay: log.timeOfDay,
            notes: log.notes || "",
        }

        logMedicationAdherence(user.uid, medicationToLog).then((res) => {
            if (res) {
                Alert.alert("Success", "Medication adherence logged successfully.");
                setShowLogMedicationModal(false);
            } else {
                Alert.alert("Error", "Failed to log medication adherence. Please try again.");
            }
        });
    }

    const addNewMedication = (medication: Medication) => {
        if (!user) return;

        const medicationToSave = {
            ...medication,
            startDate: momentToTimestamp(medication.startDate),
            endDate: medication.endDate ? momentToTimestamp(medication.endDate) : null,
        };

        saveMedication(user.uid, medicationToSave).then((id) => {
            if (id) {
                medication.id = id;
                medication.colour = getMedicationColour(medication.name);
                setMedications(prevMap => ({
                    ...prevMap,
                    [id]: medication
                }));
            }
        });
    };

    const editMedication = (medication: Medication) => {
        if (!user || !medication.id) return;

        const medicationToSave = {
            ...medication,
            startDate: momentToTimestamp(medication.startDate),
            endDate: medication.endDate ? momentToTimestamp(medication.endDate) : null,
        };

        updateMedication(user.uid, medication.id, medicationToSave).then((res) => {
            if (res) {
                setMedications(prevMap => ({
                    ...prevMap,
                    [medication.id]: {
                        ...medication,
                        colour: getMedicationColour(medication.name)
                    }
                }));
            }
        });
    };

    const removeMedication = (medicationId: string) => {
        if (!user || !medicationId) return;

        Alert.alert(
            "Delete Medication",
            "Are you sure you want to delete this medication?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        deleteMedication(user.uid, medicationId).then((res) => {
                            if (res) {
                                setMedications(prevMap => {
                                    const newMap = { ...prevMap };
                                    delete newMap[medicationId];
                                    return newMap;
                                });
                            }
                        });
                    }
                }
            ]
        );
    };

    const getMedicationColour = (name: string) => {
        // Generate a consistent color based on the medication name
        const colors = [
            theme.colours.primary,
            theme.colours.blue80,
            theme.colours.buttonBlue,
            '#9c27b0', // purple
            '#2196f3', // blue
            '#4caf50', // green
        ];

        const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        return colors[hash % colors.length];
    };

    const getAllMedications = useCallback((): Medication[] => {
        return Object.values(medications);
    }, [medications]);

    const getCurrentMedications = useCallback((): Medication[] => {
        const now = moment();
        const allMeds = getAllMedications();

        return allMeds.filter(med => {
            // check if medication is current
            const hasStarted = med.startDate.isSameOrBefore(now, 'day');
            const notEnded = !med.endDate || med.endDate.isSameOrAfter(now, 'day');
            return hasStarted && notEnded;
        });
    }, [medications]);

    const getTodaysMedications = useCallback((): Medication[] => {
        const currentMeds = getCurrentMedications();
        // TODO for simplicity, returning all current medications
        return currentMeds;
    }, [medications]);

    const renderMedicationCard = (medication: Medication) => {
        const firstLetter = medication.name.charAt(0).toUpperCase();

        return (
            <TouchableOpacity
                key={medication.id}
                onPress={() => showViewMedicationModal(medication)}
                style={styles.medicationCard}
            >
                <View style={styles.medicationIconContainer}>
                    <View style={[styles.initialsCircle, { backgroundColor: medication.colour }]}>
                        <Text style={styles.initialsText}>{firstLetter}</Text>
                    </View>
                </View>

                <View style={styles.medicationDetails}>
                    <Text style={styles.medicationName}>{medication.name}</Text>
                    <Text style={styles.medicationDosage}>{medication.dosage}</Text>
                    <Text style={styles.medicationFrequency}>{medication.frequency}</Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => removeMedication(medication.id)}
                >
                    <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colours.textSecondary} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <View style={{
                backgroundColor: theme.colours.blue20,
                height: Platform.OS === 'ios' ? 50 : 0
            }}>
                <StatusBar
                    backgroundColor={theme.colours.blue20}
                    barStyle="light-content"
                />
            </View>

            {/* Medication Form Modal */}
            <MedicationForm
                visible={showMedicationModal}
                onClose={() => setShowMedicationModal(false)}
                leftButtonText="Cancel"
                rightButtonText={rightButtonText}
                onLeftButtonPress={() => setShowMedicationModal(false)}
                onRightButtonPress={rightButtonAction}
                backgroundColor={theme.colours.background}
                existingMedication={existingMedication}
                title={modalTitle}
                readonly={readonly}
            />

            {/* Logging Medication Modal */}
            <MedicationLogForm
                visible={showLoggingMedicationModal}
                onClose={() => setShowLogMedicationModal(false)}
                leftButtonText="Cancel"
                rightButtonText="Log"
                onLeftButtonPress={() => setShowLogMedicationModal(false)}
                onRightButtonPress={handleLogMedication}
                backgroundColor={theme.colours.background}
                title="Log Medication"
                medication={existingMedication}
                timeOfDay={timeOfDay}
            />

            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Medications</Text>
                    <Text style={styles.subHeaderText}>Track your medication schedule</Text>

                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={showNewMedicationModal}
                    >
                        <FontAwesome6 name="pills" size={30} color="white" />
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.medicationsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>Current Medications</Text>
                    </View>

                    {getCurrentMedications().length > 0 ? (
                        getCurrentMedications().map(medication => renderMedicationCard(medication))
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="pill" size={48} color={theme.colours.textSecondary} />
                            <Text style={styles.emptyStateText}>No medications added yet</Text>
                        </View>
                    )}

                    {/* Daily Schedule Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>Today's Schedule</Text>
                    </View>

                    {getTodaysMedications().length > 0 ? (
                        <View style={styles.scheduleContainer}>
                            {/* Morning */}
                            <View style={styles.timeBlock}>
                                <View style={styles.timeHeader}>
                                    <MaterialCommunityIcons name="weather-sunny" size={24} color={theme.colours.textSecondary} />
                                    <Text style={styles.timeHeaderText}>Morning</Text>
                                </View>
                                {getTodaysMedications()
                                    .filter(med => med.timeOfDay.includes('morning'))
                                    .map(med => (
                                        <TouchableOpacity
                                            key={`morning-${med.id}`}
                                            style={styles.scheduleItem}
                                            onPress={() => showLogMedicationModal(med, "morning")}
                                        >
                                            <View style={[styles.scheduleItemDot, { backgroundColor: med.colour }]} />
                                            <Text style={styles.scheduleItemText}>{med.name} - {med.dosage}</Text>
                                        </TouchableOpacity>
                                    ))
                                }
                                {!getTodaysMedications().some(med => med.timeOfDay.includes('morning')) && (
                                    <Text style={styles.noMedicationText}>No morning medications</Text>
                                )}
                            </View>

                            {/* Afternoon */}
                            <View style={styles.timeBlock}>
                                <View style={styles.timeHeader}>
                                    <MaterialCommunityIcons name="weather-partly-cloudy" size={24} color={theme.colours.textSecondary} />
                                    <Text style={styles.timeHeaderText}>Afternoon</Text>
                                </View>
                                {getTodaysMedications()
                                    .filter(med => med.timeOfDay.includes('afternoon'))
                                    .map(med => (
                                        <TouchableOpacity
                                            key={`afternoon-${med.id}`}
                                            style={styles.scheduleItem}
                                            onPress={() => showLogMedicationModal(med, "afternoon")}
                                        >
                                            <View style={[styles.scheduleItemDot, { backgroundColor: med.colour }]} />
                                            <Text style={styles.scheduleItemText}>{med.name} - {med.dosage}</Text>
                                        </TouchableOpacity>
                                    ))
                                }
                                {!getTodaysMedications().some(med => med.timeOfDay.includes('afternoon')) && (
                                    <Text style={styles.noMedicationText}>No afternoon medications</Text>
                                )}
                            </View>

                            {/* Evening */}
                            <View style={styles.timeBlock}>
                                <View style={styles.timeHeader}>
                                    <MaterialCommunityIcons name="weather-night" size={24} color={theme.colours.textSecondary} />
                                    <Text style={styles.timeHeaderText}>Evening</Text>
                                </View>
                                {getTodaysMedications()
                                    .filter(med => med.timeOfDay.includes('evening'))
                                    .map(med => (
                                        <TouchableOpacity
                                            key={`evening-${med.id}`}
                                            style={styles.scheduleItem}
                                            onPress={() => showLogMedicationModal(med, "evening")}
                                        >
                                            <View style={[styles.scheduleItemDot, { backgroundColor: med.colour }]} />
                                            <Text style={styles.scheduleItemText}>{med.name} - {med.dosage}</Text>
                                        </TouchableOpacity>
                                    ))
                                }
                                {!getTodaysMedications().some(med => med.timeOfDay.includes('evening')) && (
                                    <Text style={styles.noMedicationText}>No evening medications</Text>
                                )}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-check" size={48} color={theme.colours.textSecondary} />
                            <Text style={styles.emptyStateText}>No medications scheduled for today</Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
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
    },
    headerText: {
        fontSize: 24,
        fontFamily: theme.fonts.ubuntu.bold,
        color: 'white',
        textAlign: 'center',
    },
    subHeaderText: {
        fontSize: 14,
        fontFamily: theme.fonts.ubuntu.regular,
        color: 'white',
        textAlign: 'center',
        marginTop: 4,
    },
    addButton: {
        position: 'absolute',
        right: 20,
        top: Platform.OS === 'android' ? 50 : 10,
        padding: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 2,
    },
    medicationsContainer: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
    },
    sectionHeader: {
        padding: 15,
        backgroundColor: theme.colours.blue99,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    sectionHeaderText: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
    },
    medicationCard: {
        flexDirection: 'row',
        backgroundColor: theme.colours.surface,
        marginHorizontal: 15,
        marginVertical: 8,
        borderRadius: 10,
        padding: 10,
        shadowColor: theme.colours.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    medicationIconContainer: {
        marginRight: 15,
        justifyContent: 'center',
    },
    initialsCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.white,
        fontSize: 24,
        fontWeight: 'bold',
    },
    medicationDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    medicationName: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
        marginBottom: 4,
    },
    medicationDosage: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
    },
    medicationFrequency: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 14,
        color: theme.colours.gray,
        marginTop: 2,
    },
    deleteButton: {
        justifyContent: 'center',
        padding: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyStateText: {
        marginTop: 10,
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
    },
    scheduleContainer: {
        marginHorizontal: 15,
        marginVertical: 8,
    },
    timeBlock: {
        backgroundColor: theme.colours.surface,
        borderRadius: 10,
        marginBottom: 15,
        padding: 15,
        shadowColor: theme.colours.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    timeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    timeHeaderText: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 16,
        color: theme.colours.textPrimary,
        marginLeft: 10,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    scheduleItemDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    scheduleItemText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
    },
    noMedicationText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 8,
    },
});

export default MedicationScreen;
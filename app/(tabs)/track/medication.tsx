import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome6, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import moment from 'moment';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getUserMedications, saveMedication, updateMedication, deleteMedication, logMedicationAdherence, getUserMedicationTimes } from '@/services/medicationService';
import MedicationForm from '@/components/medicationForm';
import MedicationLogForm from '@/components/medicationLogForm';
import { medicationDueOnDate, momentToTimestamp, timestampToMoment } from '@/utils/dateUtils';
import { getTodaysAppointments } from '@/services/profileService';
import Header from '@/components/header';
import {
    scheduleAllMedicationNotifications,
    scheduleMedicationNotifications,
    cancelMedicationNotifications
} from '@/services/notificationService';

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
    notificationIds?: Record<string, string>;
    [key: string]: any;
}

interface MedicationLog {
    id: string;
    medicationId: string;
    startTime: moment.Moment;
    timeOfDay: string;
}

interface MedicationLogMap {
    [id: string]: MedicationLog;
}

interface MedicationsMap {
    [id: string]: Medication;
}

const MedicationScreen = () => {
    const params = useLocalSearchParams();    
    const [medications, setMedications] = useState<MedicationsMap>({});
    const [showMedicationModal, setShowMedicationModal] = useState(false);
    const [showLoggingMedicationModal, setShowLogMedicationModal] = useState(false);

    // Modal params
    const [modalTitle, setModalTitle] = useState('New');
    const [readonly, setReadonly] = useState(false);
    const [rightButtonText, setRightButtonText] = useState('Add');
    const [rightButtonAction, setRightButtonAction] = useState(() => (_: any) => { });
    const [existingMedication, setExistingMedication] = useState<Medication | null>(null);
    const [userMedicationTimes, setUserMedicationTimes] = useState<string[]>([]);
    const [medicationLogsMap, setMedicationLogsMap] = useState<MedicationLogMap>({});
    const [medicationsFetched, setMedicationsFetched] = useState(false);
    const [timeOfDay, setTimeOfDay] = useState('morning');

    // Add state for medication times
    const [morningTime, setMorningTime] = useState('08:00');
    const [afternoonTime, setAfternoonTime] = useState('12:00');
    const [eveningTime, setEveningTime] = useState('18:00');

    const { user } = useAuth();

    useEffect(() => {
        if (params.medicationId && medicationsFetched) {
            const medId = params.medicationId as string;
            const med = medications[medId];
            if (med) {
                setTimeout(() => {
                    showViewMedicationModal(med);
                }, 500);
            }
        }
    }, [params.medicationId, medicationsFetched, medications]);

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
                setMedicationsFetched(true);

                // Schedule notifications for all medications
                scheduleAllMedicationNotifications(
                    newMedicationsMap,
                    user.uid,
                    [morningTime, afternoonTime, eveningTime]
                ).then(updatedMedications => {
                    setMedications(updatedMedications);

                    for (const id in updatedMedications) {
                        const medication = updatedMedications[id];
                        if (medication.notificationIds &&
                            Object.keys(medication.notificationIds).length > 0) {

                            // Check if notification IDs have changed
                            let hasChanged = false;
                            if (!newMedicationsMap[id].notificationIds) {
                                hasChanged = true;
                            } else {
                                for (const timeOfDay in medication.notificationIds) {
                                    if (!newMedicationsMap[id].notificationIds[timeOfDay] || newMedicationsMap[id].notificationIds[timeOfDay] !== medication.notificationIds[timeOfDay]) {
                                        hasChanged = true;
                                        break;
                                    }
                                }
                            }
                            if (hasChanged) {
                                updateMedication(user.uid, id, {
                                    notificationIds: medication.notificationIds
                                });
                            }
                        }
                    }
                });
            });

            getUserMedicationTimes(user.uid).then((times) => {
                if (!times) return;
                setUserMedicationTimes(times);
                // Parse the times array to set individual time states
                if (times.length >= 3) {
                    setMorningTime(times[0] || '08:00');
                    setAfternoonTime(times[1] || '12:00');
                    setEveningTime(times[2] || '18:00');
                }
            })

            getTodaysAppointments(user.uid).then((appointments) => {
                if (!appointments) return;
                const todayLogged: MedicationLog[] = appointments.filter((doc) => {
                    return doc.data().appointmentType === 'Medication Log'
                }).map((doc) => {
                    const data = doc.data();
                    const id = doc.id;
                    return {
                        id,
                        medicationId: data.medicationId,
                        startTime: data.startTime ? timestampToMoment(data.startTime) : moment(),
                        timeOfDay: data.timeOfDay,
                    };
                })
                const newMedicationLogsMap: MedicationLogMap = {};
                todayLogged.forEach((log) => {
                    newMedicationLogsMap[log.id + '-' + log.timeOfDay] = log;
                });
                setMedicationLogsMap(newMedicationLogsMap);
            })

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
            timeOfDay: log.timeOfDay,
            notes: log.notes || "",
        }

        const newMedicationLogsMap = { ...medicationLogsMap };
        newMedicationLogsMap[log.medicationId + "-" + log.timeOfDay] = {
            id: log.id,
            medicationId: log.medicationId,
            startTime: log.time,
            timeOfDay: log.timeOfDay,
        };
        setMedicationLogsMap(newMedicationLogsMap);


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
            colour: getMedicationColour(medication.name),
            notificationIds: {} // Initialize empty notificationIds
        };

        saveMedication(user.uid, medicationToSave).then((id) => {
            if (id) {
                medication.id = id;

                // Schedule notifications for the new medication
                scheduleMedicationNotifications(
                    medication,
                    user.uid,
                    [morningTime, afternoonTime, eveningTime]
                ).then(updatedMedication => {
                    if (updatedMedication.notificationIds &&
                        Object.keys(updatedMedication.notificationIds).length > 0) {

                        updateMedication(user.uid, id, {
                            notificationIds: updatedMedication.notificationIds
                        });
                    }

                    setMedications(prevMap => ({
                        ...prevMap,
                        [id]: {
                            ...updatedMedication,
                            colour: getMedicationColour(updatedMedication.name)
                        }
                    }));

                    Alert.alert(
                        "Medication Added",
                        "Notifications have been scheduled for this medication.",
                        [{ text: "OK" }]
                    );
                });
            }
        });
    };

    const editMedication = (medication: Medication) => {
        if (!user || !medication.id) return;

        // Cancel existing notifications
        if (medication.notificationIds) {
            cancelMedicationNotifications(medication);
        }

        const medicationToSave = {
            ...medication,
            startDate: momentToTimestamp(medication.startDate),
            endDate: medication.endDate ? momentToTimestamp(medication.endDate) : null,
            colour: getMedicationColour(medication.name),
        };

        updateMedication(user.uid, medication.id, medicationToSave).then((res) => {
            if (res) {
                // Schedule new notifications
                scheduleMedicationNotifications(
                    medication,
                    user.uid,
                    [morningTime, afternoonTime, eveningTime]
                ).then(updatedMedication => {
                    if (updatedMedication.notificationIds &&
                        Object.keys(updatedMedication.notificationIds).length > 0) {

                        updateMedication(user.uid, medication.id, {
                            notificationIds: updatedMedication.notificationIds
                        });
                    }

                    setMedications(prevMap => ({
                        ...prevMap,
                        [medication.id]: {
                            ...updatedMedication,
                            colour: getMedicationColour(updatedMedication.name)
                        }
                    }));

                    Alert.alert(
                        "Medication Updated",
                        "Notifications have been updated for this medication.",
                        [{ text: "OK" }]
                    );
                });
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
                        // Cancel notifications for this medication
                        const medication = medications[medicationId];
                        if (medication && medication.notificationIds) {
                            cancelMedicationNotifications(medication);
                        }

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
            '#00bcd4', // cyan
            '#3f51b5', // indigo
            '#009688', // teal
            '#673ab7', // deep purple
            '#03a9f4', // light blue
            '#8bc34a', // light green
            '#5e35b1', // deep indigo
            '#00796b', // dark teal
            '#1e88e5', // mid blue
            '#43a047', // mid green
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
            const notEnded = !med.endDate || med.endDate.isSameOrAfter(now, 'day');
            return notEnded;
        });
    }, [medications]);

    const getTodaysMedications = useCallback((): Medication[] => {
        const currentMeds = getCurrentMedications();
        const today = moment().startOf('day');
        return currentMeds.filter(medication => {
            const startDate = medication.startDate.startOf('day');
            const endDate = medication.endDate ? medication.endDate.startOf('day') : today.clone().add(1, 'day');
            const frequency = medication.frequency;
            return medicationDueOnDate(startDate, endDate, frequency);
        })
    }, [medications]);

    const medicationTaken = (medicationId: string, timeOfDay: string): boolean => {
        const today = moment().startOf('day');
        if (medicationLogsMap) {
            if (medicationLogsMap.hasOwnProperty(medicationId + "-" + timeOfDay)) {
                const log = medicationLogsMap[medicationId + "-" + timeOfDay];
                const logDate = log.startTime.startOf('day');
                if (logDate.isSame(today)) {
                    return log.timeOfDay === timeOfDay;
                }
            }
        }
        return false;
    };

    const medicationStatus = (medicationId: string, timeOfDay: string): "taken" | "late" | "missed" | null => {
        const taken = medicationTaken(medicationId, timeOfDay);
        if (taken) {
            return "taken";
        }
        const now = moment();
        const [morningTime, afternoonTime, eveningTime] = userMedicationTimes.map(time => {
            const [hour, minute] = time.split(':').map(Number);
            return moment().set({ hour, minute });
        });
        if (!morningTime || !afternoonTime || !eveningTime) return null;
        const medicationTime = timeOfDay === "morning" ? morningTime : timeOfDay === "afternoon" ? afternoonTime : eveningTime;
        // get the time after this to check if it has been missed
        let afterTime: moment.Moment | null = null;
        if (timeOfDay === "morning") {
            afterTime = afternoonTime;
        } else if (timeOfDay === "afternoon") {
            afterTime = eveningTime;
        }

        if (afterTime && now.isAfter(afterTime)) {
            return "missed";
        }
        if (now.isAfter(medicationTime)) {
            return "late";
        }
        return null;
    };

    const renderStatusBox = (status: "taken" | "late" | "missed" | null) => {
        if (!status) return null;
        switch (status) {
            case "taken":
                return (
                    <View style={styles.statusBox}>
                        <Text style={[styles.scheduleItemText, { color: theme.colours.success }]}>Taken</Text>
                        <Ionicons name="checkmark-circle-outline" size={24} color={theme.colours.success} />
                    </View>
                );
            case "late":
                return (
                    <View style={styles.statusBox}>
                        <Text style={[styles.scheduleItemText, { color: theme.colours.error }]}>Late</Text>
                        <Ionicons name="alert-circle-outline" size={24} color={theme.colours.error} />
                    </View>
                );
            case "missed":
                return (
                    <View style={styles.statusBox}>
                        <Text style={[styles.scheduleItemText, { color: theme.colours.darkDanger }]}>Missed</Text>
                        <Ionicons name="close-circle-outline" size={24} color={theme.colours.darkDanger} />
                    </View>
                );
            default:
                return null;
        }
    };

    const renderMedicationCard = (medication: Medication) => {
        const firstLetter = medication.name.charAt(0).toUpperCase();
        const dosageString = `${medication.dosage} ${medication.units}${parseInt(medication.dosage) > 1 ? 's' : ''}`;
        const hasNotifications = medication.notificationIds &&
            Object.keys(medication.notificationIds).length > 0;

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
                    <Text style={styles.medicationDosage}>{dosageString}</Text>
                    <Text style={styles.medicationFrequency}>{medication.frequency}</Text>

                    {hasNotifications && (
                        <View style={styles.notificationIndicator}>
                            <Ionicons name="notifications" size={16} color={theme.colours.primary} />
                            <Text style={styles.notificationText}>Reminders set</Text>
                        </View>
                    )}
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
                <Header
                    title="Medications"
                    subtitle="Track your medication schedule"
                    onRightButtonPress={showNewMedicationModal}
                    rightButtonIcon={<FontAwesome6 name="pills" size={30} color="white" />}
                    rightButtonText='Add'
                />


                <ScrollView style={styles.medicationsContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionHeaderText}>Current and Future Medications</Text>
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
                        <Text style={styles.sectionSubHeaderText}> - Tap a medication to log</Text>
                    </View>

                    {getTodaysMedications().length > 0 ? (
                        <View style={styles.scheduleContainer}>
                            {/* Morning */}
                            <View style={styles.timeBlock}>
                                <View style={styles.timeHeader}>
                                    <MaterialCommunityIcons name="weather-sunny" size={24} color={theme.colours.textSecondary} />
                                    <Text style={styles.timeHeaderText}>Morning</Text>
                                    <Text style={styles.timeSubHeaderText}>- {morningTime}</Text>
                                </View>
                                {getTodaysMedications()
                                    .filter(med => med.timeOfDay.includes('morning'))
                                    .map(med => {
                                        const status = medicationStatus(med.id, "morning");
                                        return (
                                            <TouchableOpacity
                                                key={`morning-${med.id}`}
                                                style={[
                                                    styles.scheduleItem,
                                                    status === "taken" && styles.medicationTakenItem,
                                                    status === "late" && styles.medicationLateItem,
                                                    status === "missed" && styles.medicationMissedItem
                                                ]}
                                                onPress={() => showLogMedicationModal(med, "morning")}
                                            >
                                                <View style={[styles.scheduleItemDot, { backgroundColor: med.colour }]} />
                                                <Text style={styles.scheduleItemText}>{med.name} - {med.dosage} {med.units}{parseInt(med.dosage) > 1 ? 's' : ''}</Text>
                                                {renderStatusBox(status)}
                                            </TouchableOpacity>
                                        );
                                    })
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
                                    <Text style={styles.timeSubHeaderText}>- {afternoonTime}</Text>
                                </View>
                                {getTodaysMedications()
                                    .filter(med => med.timeOfDay.includes('afternoon'))
                                    .map(med => {
                                        const status = medicationStatus(med.id, "afternoon");
                                        return (
                                            <TouchableOpacity
                                                key={`afternoon-${med.id}`}
                                                style={[
                                                    styles.scheduleItem,
                                                    status === "taken" && styles.medicationTakenItem,
                                                    status === "late" && styles.medicationLateItem,
                                                    status === "missed" && styles.medicationMissedItem
                                                ]}
                                                onPress={() => showLogMedicationModal(med, "afternoon")}
                                            >
                                                <View style={[styles.scheduleItemDot, { backgroundColor: med.colour }]} />
                                                <Text style={styles.scheduleItemText}>{med.name} - {med.dosage} {med.units}{parseInt(med.dosage) > 1 ? 's' : ''}</Text>
                                                {renderStatusBox(status)}
                                            </TouchableOpacity>
                                        );
                                    })
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
                                    <Text style={styles.timeSubHeaderText}>- {eveningTime}</Text>
                                </View>
                                {getTodaysMedications()
                                    .filter(med => med.timeOfDay.includes('evening'))
                                    .map(med => {
                                        const status = medicationStatus(med.id, "evening");
                                        return (
                                            <TouchableOpacity
                                                key={`evening-${med.id}`}
                                                style={[
                                                    styles.scheduleItem,
                                                    status === "taken" && styles.medicationTakenItem,
                                                    status === "late" && styles.medicationLateItem,
                                                    status === "missed" && styles.medicationMissedItem
                                                ]}
                                                onPress={() => showLogMedicationModal(med, "evening")}
                                            >
                                                <View style={[styles.scheduleItemDot, { backgroundColor: med.colour }]} />
                                                <Text style={styles.scheduleItemText}>{med.name} - {med.dosage} {med.units}{parseInt(med.dosage) > 1 ? 's' : ''}</Text>
                                                {renderStatusBox(status)}

                                            </TouchableOpacity>
                                        );
                                    })
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
                    <View style={{ height: 100 }} />
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
    medicationsContainer: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
    },
    sectionHeader: {
        padding: 15,
        backgroundColor: theme.colours.blue99,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionHeaderText: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
    },
    sectionSubHeaderText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
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
        marginRight: 8,
    },
    timeSubHeaderText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 14,
        color: theme.colours.textSecondary,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        marginBottom: 5,
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
    medicationTakenItem: {
        backgroundColor: `${theme.colours.success}20`,
        borderColor: theme.colours.success,
        borderWidth: 1,
        borderRadius: 5,
        borderBottomColor: undefined,
        borderBottomWidth: undefined,
    },
    medicationLateItem: {
        backgroundColor: `${theme.colours.error}20`,
        borderColor: theme.colours.error,
        borderWidth: 1,
        borderRadius: 5,
        borderBottomColor: undefined,
        borderBottomWidth: undefined,
    },
    medicationMissedItem: {
        backgroundColor: `${theme.colours.darkDanger}20`,
        borderColor: theme.colours.error,
        borderWidth: 1,
        borderRadius: 5,
        borderBottomColor: undefined,
        borderBottomWidth: undefined,
    },
    statusBox: {
        marginLeft: 'auto',
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    notificationText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 12,
        color: theme.colours.primary,
        marginLeft: 4,
    },
});

export default MedicationScreen;
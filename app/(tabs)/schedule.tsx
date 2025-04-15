import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, TouchableOpacity, Alert } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { deleteUserAppointment, getUserAppointments, saveUserAppointment, updateUserAppointment } from '@/services/profileService';
import AppointmentForm from '@/components/appointmentFormModal';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
    scheduleAppointmentNotification,
    cancelAppointmentNotification,
    scheduleAllAppointmentNotifications,
} from '@/services/notificationService';
import { medicationDueOnDate, momentToTimestamp, timestampToMoment } from '@/utils/dateUtils';
import { getUserMedications, getUserMedicationTimes } from '@/services/medicationService';

interface Appointment {
    id: string;
    description: string;
    provider: string;
    startTime: moment.Moment;
    endTime: moment.Moment;
    appointmentType: string;
    staff: string;
    travelTime: moment.Duration;
    colour?: string;
    notificationId?: string;
    [key: string]: any; // Allow additional properties
}

interface AppointmentsMap {
    [id: string]: Appointment;
}

const ScheduleScreen = () => {
    const params = useLocalSearchParams();
    const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());
    const [appointmentsFetched, setAppointmentsFetched] = useState(false);
    const [appointmentsMap, setAppointmentsMap] = useState<AppointmentsMap>({});
    const [medications, setMedications] = useState<Appointment[]>([]);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    // modal params
    const [modalTitle, setModalTitle] = useState('New');
    const [readonly, setReadonly] = useState(false);
    const [rightButtonText, setRightButtonText] = useState('Add');
    const [rightButtonAction, setRightButtonAction] = useState(() => (appointment: any) => { });
    const [existingAppointment, setExistingAppointment] = useState<Appointment | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        if (params.appointmentId) {
            const appointmentId = params.appointmentId as string;
            while (!appointmentsFetched) {
                // Wait for appointments to be fetched
                setTimeout(() => { }, 100);
            }
            
            const appointment = appointmentsMap[appointmentId];
            if (appointment) {
                showViewAppointmentModal(appointment);
            }
        }
        if (params.openNewAppointment === 'true') {
            setTimeout(() => {
                showNewAppointmentModal();
            }, 300);
        }
    }, [params.openNewAppointment]);


    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getUserAppointments(user?.uid).then((appointmentDocs) => {
                const newAppointmentsMap: AppointmentsMap = {};

                appointmentDocs.forEach((doc) => {
                    const data = doc.data();
                    const id = doc.id;

                    newAppointmentsMap[id] = {
                        ...data, // Include any additional fields
                        id,
                        description: data.description || '',
                        provider: data.provider || '',
                        startTime: timestampToMoment(data.startTime),
                        endTime: timestampToMoment(data.endTime),
                        appointmentType: data.appointmentType || '',
                        staff: data.staff || '',
                        travelTime: moment.duration(data.travelTime || 0),
                        colour: getAppointmentColour(data.appointmentType),
                        notificationId: data.notificationId || null,
                    };
                });

                setAppointmentsMap(newAppointmentsMap);
                setAppointmentsFetched(true);

                // Schedule notifications for all appointments so that the device last used recieves the notification
                scheduleAllAppointmentNotifications(newAppointmentsMap, user?.uid).then(updatedAppointments => {
                    // Update appointments with notification IDs in state
                    setAppointmentsMap(updatedAppointments);

                    // Save notification IDs to Firebase
                    for (const id in updatedAppointments) {
                        const appointment = updatedAppointments[id];
                        if (appointment.notificationId &&
                            (!newAppointmentsMap[id].notificationId ||
                                newAppointmentsMap[id].notificationId !== appointment.notificationId)) {

                            updateUserAppointment(user.uid, id, { notificationId: appointment.notificationId });
                        }
                    }
                });
            });
            getUserMedicationTimes(user.uid).then((medicationTimes) => {
                if (medicationTimes) {
                    const [morningTime, afternoonTime, eveningTime] = medicationTimes;
                    getUserMedications(user.uid).then((medicationDocs) => {
                        const newMedications: Appointment[] = [];

                        medicationDocs.forEach((doc) => {
                            const data = doc.data();
                            const id = doc.id;

                            data.timeOfDay.forEach((time: string) => {
                                let startTime = time === 'morning' ? morningTime : time === 'afternoon' ? afternoonTime : eveningTime;
                                newMedications.push({
                                    ...data,
                                    id: id + "-" + time,
                                    description: `Need to take ${data.dosage} ${data.units}`,
                                    provider: data.name,
                                    startTime: moment().set({
                                        hour: parseInt(startTime.split(':')[0]),
                                        minute: parseInt(startTime.split(':')[1]),
                                    }),
                                    endTime: moment().set({
                                        hour: parseInt(startTime.split(':')[0]),
                                        minute: parseInt(startTime.split(':')[1]),
                                    }),
                                    appointmentType: 'Medication',
                                    staff: 'Medication due',
                                    travelTime: moment.duration(0),

                                });
                            })
                        });
                        setMedications(newMedications);
                    })
                }
            });
        }, [])
    );

    const showNewAppointmentModal = () => {
        setRightButtonAction(() => {
            return (newAppointment: any) => {
                addNewAppointment(newAppointment as Appointment);
                setShowAppointmentModal(false);
            };
        });

        setExistingAppointment(null);
        setModalTitle('New');
        setReadonly(false);
        setRightButtonText('Add');
        setShowAppointmentModal(true);
    }

    const showEditAppointmentModal = (appointment: Appointment) => {
        setExistingAppointment(appointment);

        setRightButtonAction(() => {
            return (updatedAppointment: any) => {
                editAppointment(updatedAppointment as Appointment);
                setShowAppointmentModal(false);
            };
        });

        setModalTitle('Edit');
        setReadonly(false);
        setRightButtonText('Save');
        setShowAppointmentModal(true);
    }

    const showViewAppointmentModal = (appointment: Appointment) => {
        setExistingAppointment(appointment);
        if (appointment.appointmentType === 'Medication Log') {
            setRightButtonText('Delete');
            setRightButtonAction(() => {
                return (app: any) => {
                    Alert.alert(
                        'Delete Log',
                        'Are you sure you want to delete this log?',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Delete', style: 'destructive', onPress: () => {
                                    deleteAppointment(appointment.id);
                                    setShowAppointmentModal(false);
                                }
                            }
                        ]
                    );
                }
            })
        } else {
            setRightButtonAction(() => {
                return (app: any) => {
                    showEditAppointmentModal(appointment);
                };
            });
            setRightButtonText('Edit');
        }

        setModalTitle(' ');
        setReadonly(true);
        setShowAppointmentModal(true);
    }

    const addNewAppointment = (appointment: Appointment) => {
        if (!user) return;

        const appointmentToSave = {
            ...appointment,
            startTime: momentToTimestamp(appointment.startTime),
            endTime: momentToTimestamp(appointment.endTime),
            travelTime: appointment.travelTime ? appointment.travelTime.asMilliseconds() : 0
        };

        saveUserAppointment(user.uid, appointmentToSave).then(async (id) => {
            if (id) {
                appointment.id = id;
                appointment.colour = getAppointmentColour(appointment.appointmentType);

                let reminderTimeMins = 0;
                // Schedule notification
                const res = await scheduleAppointmentNotification(appointment, user.uid);
                if (res) {
                    const [notificationId, reminderTime ] = res;
                    appointment.notificationId = notificationId;
                    appointment.reminderTime = reminderTime;
                    reminderTimeMins = reminderTime;
                    // Update appointment in Firebase with the notification ID
                    updateUserAppointment(user.uid, id, { notificationId, reminderTime });
                }

                setAppointmentsMap(prevMap => ({
                    ...prevMap,
                    [id]: appointment
                }));

                const remTime = moment.duration(reminderTimeMins, 'minutes');
                const remTimeHours = remTime.hours();
                const remTimeMinutes = remTime.minutes();

                let bodyStr = "A notification will remind you ";
                if (remTimeHours > 0) {
                    bodyStr += `${remTimeHours} hour${remTimeHours > 1 && "s" || ""}`;
                    if (remTimeMinutes > 0) {
                        bodyStr += ` and ${remTimeMinutes} minute${remTimeMinutes > 1 && "s" || ""}`;
                    }
                    bodyStr += " before the appointment";
                } else if (remTimeMinutes > 0) {
                    bodyStr += `${remTimeMinutes} minute${remTimeMinutes > 1 && "s" || ""}`;
                    bodyStr += " before the appointment";
                } else {
                    bodyStr += "when the appointment is set to start";
                }


                Alert.alert(
                    "Appointment Created",
                    bodyStr,
                    [{ text: "OK" }]
                );

            }
        });
    }

    const editAppointment = (appointment: Appointment) => {
        if (!user || !appointment.id) return;

        // Cancel existing notification if there is one
        if (appointment.notificationId) {
            cancelAppointmentNotification(appointment);
        }

        const appointmentToSave = {
            ...appointment,
            startTime: momentToTimestamp(appointment.startTime),
            endTime: momentToTimestamp(appointment.endTime),
            travelTime: appointment.travelTime ? appointment.travelTime.asMilliseconds() : 0
        };

        updateUserAppointment(user.uid, appointment.id, appointmentToSave).then(async (res) => {
            if (res) {
                // Schedule a new notification for the updated appointment
                const res = await scheduleAppointmentNotification(appointment, user.uid);
                if (res) {
                    const [notificationId, reminderTime] = res;
                    appointment.notificationId = notificationId;
                    appointment.reminderTime = reminderTime;
                    // Update the appointment in Firebase with the new notification ID
                    updateUserAppointment(user.uid, appointment.id, { notificationId, reminderTime });
                }

                setAppointmentsMap(prevMap => ({
                    ...prevMap,
                    [appointment.id]: {
                        ...appointment,
                        colour: getAppointmentColour(appointment.appointmentType)
                    }
                }));

                // Show confirmation to the user
                Alert.alert(
                    "Appointment Updated",
                    "The reminder has been updated for this appointment.",
                    [{ text: "OK" }]
                );
            }
        });
    }

    const deleteAppointment = (appointmentId: string) => {
        if (!user || !appointmentId) return;

        // Cancel notification for the appointment being deleted
        const appointment = appointmentsMap[appointmentId];
        if (appointment && appointment.notificationId) {
            cancelAppointmentNotification(appointment);
        }

        deleteUserAppointment(user.uid, appointmentId).then((res) => {
            if (res) {
                setAppointmentsMap(prevMap => {
                    const newMap = { ...prevMap };
                    delete newMap[appointmentId];
                    return newMap;
                });
                setShowAppointmentModal(false);
            }
        });
    }

    const getAppointmentColour = (type: string) => {
        switch (type) {
            case "Medication":
                return theme.colours.primary;
            case "Appointment":
                return theme.colours.blue80;
            default:
                return theme.colours.buttonBlue;
        }
    };

    // Convert the map to array when needed for filtering
    const getAllAppointments = useCallback((): Appointment[] => {
        return Object.values(appointmentsMap);
    }, [appointmentsMap]);

    const getUpcomingAppointments = useCallback(() => {
        const allAppointments = getAllAppointments();
        if (allAppointments.length === 0) return [];

        const today = moment();
        return allAppointments.filter(appointment =>
            appointment.startTime.isAfter(today, 'day')
        );
    }, [appointmentsMap]);

    // TODO allow appointments that span over multiple days
    const dayAppointments = useCallback((date: moment.Moment) => {
        const allAppointments = getAllAppointments();
        if (allAppointments.length === 0) return [];

        const dayAppointments = allAppointments.filter(appointment =>
            date.isSame(appointment.startTime, 'day')
        );
        const dayMedications = medications.filter(medication => {
            const startDate = timestampToMoment(medication.startDate).startOf('day');
            const endDate = medication.endDate ? timestampToMoment(medication.endDate.startOf('day')) : date.clone().add(1, 'day');
            const frequency = medication.frequency;
            return medicationDueOnDate(startDate, endDate, frequency, date);
        });
        
        const idsToRemove = dayAppointments.filter(appointment => {
            return appointment.appointmentType === 'Medication Log'
        }).map(appointment => appointment.medicationId + "-" + appointment.timeOfDay);

        const filteredMedications = dayMedications.filter(medication => {
            return !idsToRemove.includes(medication.id);
        });

        return [...dayAppointments, ...filteredMedications].sort((a, b) => {
            if (a.startTime.isBefore(b.startTime)) return -1;
            if (a.startTime.isAfter(b.startTime)) return 1;
            return 0;
        });
    }, [appointmentsMap, medications, selectedDate]);

    const renderAppointment = (appointment: Appointment, future?: boolean) => {
        const initials = appointment.provider
            .split(' ')
            .map(name => name && name[0])
            .join('')
            .slice(0, 4);

        const size = initials.length > 3 ? 16 : 20;
        
        if (appointment.appointmentType === 'Medication Log' || appointment.appointmentType === 'Medication') {
            return (
                <TouchableOpacity
                    key={appointment.id}
                    onPress={() => { showViewAppointmentModal(appointment) }}
                >
                    <View style={styles.appointmentCard}>
                        <View style={styles.appointmentIconTime}>
                            <View style={[styles.initialsCircle, { backgroundColor: appointment.colour }]}>
                                <Text style={[styles.initialsText, { fontSize: size }]}>{initials}</Text>
                            </View>
                            <View style={styles.appointmentTime}>
                                {future && <Text style={styles.futureDateText}>{appointment.startTime.format("DD MMM")}</Text>}
                                <Text style={styles.timeText}>{appointment.startTime.format("HH:mm")}</Text>
                                {!appointment.startTime.isSame(appointment.endTime, "minute") &&
                                    <>
                                        <Text style={styles.timeSep}>I</Text>
                                        <Text style={styles.timeText}>{appointment.endTime.format("HH:mm")}</Text>
                                    </>
                                }
                            </View>
                        </View>
                        <View style={styles.appointmentDetails}>
                            <Text style={styles.providerName}>{appointment.provider}</Text>
                            <Text style={styles.appointmentType}>
                                {appointment.staff + " log"}
                            </Text>
                            <Text style={styles.staffInfo}>{appointment.description}</Text>
                            {appointment.notificationId && (
                                <View style={styles.notificationIndicator}>
                                    <Ionicons name="notifications" size={16} color={theme.colours.primary} />
                                    <Text style={styles.notificationText}>Reminder set</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }
        return (
            <TouchableOpacity
                key={appointment.id}
                onPress={() => { showViewAppointmentModal(appointment) }}
            >
                <View style={styles.appointmentCard}>
                    <View style={styles.appointmentIconTime}>
                        <View style={[styles.initialsCircle, { backgroundColor: appointment.colour }]}>
                            <Text style={[styles.initialsText, { fontSize: size }]}>{initials}</Text>
                        </View>
                        <View style={styles.appointmentTime}>
                            {future && <Text style={styles.futureDateText}>{appointment.startTime.format("DD MMM")}</Text>}
                            <Text style={styles.timeText}>{appointment.startTime.format("HH:mm")}</Text>
                            {!appointment.startTime.isSame(appointment.endTime, "minute") &&
                                <>
                                    <Text style={styles.timeSep}>I</Text>
                                    <Text style={styles.timeText}>{appointment.endTime.format("HH:mm")}</Text>
                                </>
                            }
                        </View>
                    </View>
                    <View style={styles.appointmentDetails}>
                        <Text style={styles.providerName}>{appointment.provider}</Text>
                        <Text style={styles.appointmentType}>
                            {appointment.appointmentType}
                            {appointment.staff ? ` with ${appointment.staff}` : ''}
                        </Text>
                        <Text style={styles.staffInfo}>{appointment.description}</Text>
                        {appointment.notificationId && appointment.endTime.isAfter(moment()) && (
                            <View style={styles.notificationIndicator}>
                                <Ionicons name="notifications" size={16} color={theme.colours.primary} />
                                <Text style={styles.notificationText}>Reminder set</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderDayHeader = () => {
        const day = selectedDate.date();
        const dayName = selectedDate.format('ddd');

        return (
            <View style={styles.dayHeader}>
                <Text style={styles.dayNumber}>{day}</Text>
                <Text style={styles.dayName}>{dayName}</Text>
            </View>
        );
    };

    const getDateDots = (date: moment.Moment) => {
        const dotsForDate: { dots: { color: string, selectedColor?: string }[] } = { dots: [] };
        const appsForDay = dayAppointments(date);

        const uniqueAppointments = new Map<string, Appointment>();
        appsForDay.forEach(appointment => {
            const baseId = appointment.id.split('-')[0];
            if (!uniqueAppointments.has(baseId)) {
                uniqueAppointments.set(baseId, appointment);
                dotsForDate.dots.push({
                    color: appointment.colour || theme.colours.buttonBlue,
                    selectedColor: appointment.colour === theme.colours.primary
                        ? theme.colours.blue99
                        : appointment.colour,
                });
            }
        });
        return dotsForDate;
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
            <AppointmentForm
                visible={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                leftButtonText="Cancel"
                rightButtonText={rightButtonText}
                onLeftButtonPress={() => setShowAppointmentModal(false)}
                onDeleteAppointment={() => {
                    if (existingAppointment) {
                        deleteAppointment(existingAppointment.id);
                    }
                }}
                onRightButtonPress={rightButtonAction}
                backgroundColor={theme.colours.background}
                existingAppointment={existingAppointment}
                title={modalTitle}
                readonly={readonly}
            />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Schedule</Text>
                    <Text style={styles.subHeaderText}>Your weeks schedule</Text>
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            right: 20,
                            top: Platform.OS === 'android' ? 50 : 10,
                            padding: 8,
                            alignItems: 'center',
                        }}
                        onPress={showNewAppointmentModal}
                    >
                        <FontAwesome6 name="calendar-plus" size={30} color="white" />
                        <Text style={{ color: 'white', fontSize: 14, textAlign: 'center', marginTop: 2 }}>New</Text>
                    </TouchableOpacity>
                </View>
                <CalendarStrip
                    style={styles.calendarStrip}
                    calendarColor={theme.colours.background}
                    calendarHeaderStyle={styles.calendarHeader}
                    dateNumberStyle={styles.dateNumber}
                    dateNameStyle={styles.dateName}
                    highlightDateNumberStyle={styles.highlightedDateNumber}
                    highlightDateNameStyle={styles.highlightedDateName}
                    disabledDateNameStyle={styles.disabledDateName}
                    disabledDateNumberStyle={styles.disabledDateNumber}
                    iconContainer={{ flex: 0.1 }}
                    onDateSelected={(date) => setSelectedDate(date)}
                    selectedDate={selectedDate}
                    startingDate={moment().subtract(3, 'days')}
                    scrollable
                    highlightDateContainerStyle={{
                        backgroundColor: theme.colours.primary,
                        borderColor: theme.colours.calendar.selected,
                        borderRadius: 30,
                    }}
                    customDatesStyles={[
                        {
                            // Current date circle
                            dates: [new Date()],
                            dateContainerStyle: {
                                borderWidth: 2.5,
                                borderColor: theme.colours.calendar?.appointment,
                                borderRadius: 30,
                            },
                        }
                    ]}
                    markedDates={getDateDots}
                />

                <ScrollView style={styles.appointmentsContainer}>
                    {renderDayHeader()}
                    {dayAppointments(selectedDate).length > 0 ? (
                        dayAppointments(selectedDate).map(appointment => renderAppointment(appointment))
                    ) : (
                        <View style={styles.noAppointments}>
                            <Ionicons name="calendar-outline" size={48} color={theme.colours.textSecondary} />
                            <Text style={styles.noAppointmentsText}>No appointments scheduled for this day</Text>
                        </View>
                    )}
                    <View style={styles.upcomingHeader}>
                        <Text style={styles.upcomingText}>Upcoming</Text>
                    </View>
                    {getUpcomingAppointments().length > 0 ? (
                        getUpcomingAppointments().map(appointment => renderAppointment(appointment, true))
                    ) : (
                        <View style={styles.noAppointments}>
                            <Ionicons name="calendar-outline" size={48} color={theme.colours.textSecondary} />
                            <Text style={styles.noAppointmentsText}>No upcoming appointments</Text>
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
    calendarStrip: {
        height: 100,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: theme.colours.blue99,
    },
    calendarHeader: {
        color: theme.colours.textPrimary,
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
    },
    dateNumber: {
        color: theme.colours.textPrimary,
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 16,
    },
    dateName: {
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
        fontSize: 14,
    },
    highlightedDateNumber: {
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.textOnPrimary,
        fontSize: 14,
    },
    highlightedDateName: {
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textOnPrimary,
        fontSize: 12,
    },
    disabledDateName: {
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.lightGray,
        fontSize: 12,
    },
    disabledDateNumber: {
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.lightGray,
        fontSize: 14,
    },
    appointmentsContainer: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
    },
    dayHeader: {
        padding: 15,
        backgroundColor: theme.colours.blue99,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    dayNumber: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
    },
    upcomingHeader: {
        padding: 15,
        backgroundColor: theme.colours.blue99,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    upcomingText: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
        marginTop: 60,
    },
    dayName: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 18,
        color: theme.colours.textSecondary,
    },
    appointmentCard: {
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
    appointmentIconTime: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
        borderRightWidth: 1,
        borderRightColor: theme.colours.divider,
    },
    appointmentTime: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 5,
    },
    timeText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
    },
    timeSep: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
    },
    futureDateText: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 14,
        color: theme.colours.textSecondary,
    },
    appointmentDetails: {
        flex: 1,
    },
    providerName: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
        marginBottom: 4,
    },
    appointmentType: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        color: theme.colours.textSecondary,
        marginBottom: 2,
    },
    staffInfo: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 14,
        color: theme.colours.gray,
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
        fontWeight: 'bold',
    },
    noAppointments: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    noAppointmentsText: {
        marginTop: 10,
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
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

export default ScheduleScreen;
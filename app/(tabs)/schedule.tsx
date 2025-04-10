import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, TouchableOpacity } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';
import { Timestamp } from 'firebase/firestore';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { deleteUserAppointment, getUserAppointments, saveUserAppointment, updateUserAppointment } from '@/services/profileService';
import AppointmentForm from '@/components/appointmentFormModal';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

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
    [key: string]: any; // Allow additional properties
}

interface AppointmentsMap {
    [id: string]: Appointment;
}

const ScheduleScreen = () => {
    const params = useLocalSearchParams();
    const [selectedDate, setSelectedDate] = useState<moment.Moment>(moment());
    const [appointmentsMap, setAppointmentsMap] = useState<AppointmentsMap>({});
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    // modal params
    const [modalTitle, setModalTitle] = useState('New');
    const [readonly, setReadonly] = useState(false);
    const [rightButtonText, setRightButtonText] = useState('Add');
    const [rightButtonAction, setRightButtonAction] = useState(() => (appointment: any) => { });
    const [existingAppointment, setExistingAppointment] = useState<Appointment | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        if (params.openNewAppointment === 'true') {
            setTimeout(() => {
                showNewAppointmentModal();
            }, 500);
        }
    }, [params.openNewAppointment]);


    useFocusEffect(
        useCallback(() => {
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
                    };
                });

                setAppointmentsMap(newAppointmentsMap);
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
        setRightButtonAction(() => {
            return (app: any) => {
                showEditAppointmentModal(appointment);
            };
        });

        setModalTitle(' ');
        setReadonly(true);
        setRightButtonText('Edit');
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

        saveUserAppointment(user.uid, appointmentToSave).then((id) => {
            if (id) {
                appointment.id = id;
                appointment.colour = getAppointmentColour(appointment.appointmentType);
                setAppointmentsMap(prevMap => ({
                    ...prevMap,
                    [id]: appointment
                }));
            }
        });
    }

    const editAppointment = (appointment: Appointment) => {
        if (!user || !appointment.id) return;

        const appointmentToSave = {
            ...appointment,
            startTime: momentToTimestamp(appointment.startTime),
            endTime: momentToTimestamp(appointment.endTime),
            travelTime: appointment.travelTime ? appointment.travelTime.asMilliseconds() : 0
        };

        updateUserAppointment(user.uid, appointment.id, appointmentToSave).then((res) => {
            if (res) {
                setAppointmentsMap(prevMap => ({
                    ...prevMap,
                    [appointment.id]: {
                        ...appointment,
                        colour: getAppointmentColour(appointment.appointmentType)
                    }
                }));
            }
        });
    }

    const deleteAppointment = (appointmentId: string) => {
        if (!user || !appointmentId) return;
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

    const timestampToMoment = (timestamp: Timestamp) => {
        const jsDate = timestamp.toDate();
        return moment(jsDate);
    };

    const momentToTimestamp = (momentObj: moment.Moment) => {
        return Timestamp.fromDate(momentObj.toDate());
    };

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

        return allAppointments.filter(appointment =>
            date.isSame(appointment.startTime, 'day')
        );
    }, [appointmentsMap, selectedDate]);

    const renderAppointment = (appointment: Appointment, future?: boolean) => {
        const initials = appointment.provider
            .split(' ')
            .map(name => name && name[0])
            .join('')
            .slice(0, 4);

        const size = initials.length > 3 ? 16 : 20;

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

        appsForDay.forEach(appointment => {
            dotsForDate.dots.push({
                color: appointment.colour || theme.colours.buttonBlue,
                selectedColor: appointment.colour === theme.colours.primary
                    ? theme.colours.blue99
                    : appointment.colour,
            });
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
});

export default ScheduleScreen;
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/constants/theme';
import { deleteUserAppointment, getUserAppointments, updateUserAppointment } from '@/services/profileService';
import { Timestamp } from 'firebase/firestore'
import moment from 'moment';
import { useAuth } from '@/context/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppointmentForm from '@/components/appointmentFormModal';
import { useFocusEffect } from 'expo-router';
import { momentToTimestamp, timestampToMoment } from '@/utils/dateUtils';

// TODO add medications to the schedule

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
    timeUntil?: string;
    [key: string]: any; // Allow additional properties
}

interface AppointmentsMap {
    [id: string]: Appointment;
}

const TodaySchedule = () => {
    const [appointmentsMap, setAppointmentsMap] = useState<AppointmentsMap>({});
    const [visibleAppointmentIds, setVisibleAppointmentIds] = useState<string[]>([]);

    const appointmentsMapRef = useRef<AppointmentsMap>({});
    const { user } = useAuth();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const firstSyncRef = useRef<NodeJS.Timeout | null>(null);

    const [showAppointmentModal, setShowAppointmentModal] = useState(false);

    const [modalTitle, setModalTitle] = useState('New');
    const [readonly, setReadonly] = useState(false);
    const [rightButtonText, setRightButtonText] = useState('Add');
    const [rightButtonAction, setRightButtonAction] = useState(() => (appointment: any) => { });
    const [existingAppointment, setExistingAppointment] = useState<Appointment | null>(null);

    useFocusEffect(
        useCallback(() => {
            getUserAppointments(user?.uid).then((appointmentDocs) => {
                const newAppointmentsMap: AppointmentsMap = {};

                appointmentDocs.forEach((doc) => {
                    const data = doc.data();
                    const appointment = {
                        ...data, // Include any additional fields
                        id: doc.id,
                        description: data.description || '',
                        startTime: timestampToMoment(data.startTime),
                        appointmentType: data.appointmentType || '',
                        colour: getAppointmentColour(data.appointmentType),
                        endTime: timestampToMoment(data.endTime),
                        travelTime: moment.duration(data.travelTime || 0),
                        provider: data.provider || '',
                        staff: data.staff || '',
                    };
                    if (appointment.appointmentType === 'Medication Log') return;
                    newAppointmentsMap[doc.id] = appointment;
                });

                setAppointmentsMap(newAppointmentsMap);
                appointmentsMapRef.current = newAppointmentsMap;
                filterFutureOnly();
                setMinuteSync();
            });

            return () => {
                if (firstSyncRef.current) clearTimeout(firstSyncRef.current);
                if (intervalRef.current) clearInterval(intervalRef.current);
            };
        }, [])
    );

    useEffect(() => {
        appointmentsMapRef.current = appointmentsMap;
    }, [appointmentsMap]);

    const setMinuteSync = () => {
        const now = moment()
        const nextMinute = now.clone().add(1, 'minute').startOf('minute');
        const timeout = nextMinute.diff(now, 'milliseconds');

        if (firstSyncRef.current) clearTimeout(firstSyncRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        firstSyncRef.current = setTimeout(() => {
            filterFutureOnly();

            intervalRef.current = setInterval(() => {
                filterFutureOnly();
            }, 60000); // 1 minute interval
        }, timeout);
    }

    const filterFutureOnly = () => {
        const now = moment().startOf('minute');
        const currentMap = appointmentsMapRef.current;
        const updatedMap: AppointmentsMap = {};
        const visibleIds: string[] = [];

        // Filter appointments that are in the future and on the same day
        Object.keys(currentMap).forEach(id => {
            const appointment = currentMap[id];
            if (appointment.startTime.isAfter(now) && appointment.startTime.isSame(now, 'day')) {
                const timeUntil = calculateTimeUntil(appointment.startTime, now);
                updatedMap[id] = {
                    ...appointment,
                    timeUntil,
                };
                visibleIds.push(id);
            }
        });

        visibleIds.sort((a, b) => {
            return updatedMap[a].startTime.diff(updatedMap[b].startTime);
        });

        setAppointmentsMap(updatedMap);
        setVisibleAppointmentIds(visibleIds);
    }

    const calculateTimeUntil = (startTime: moment.Moment, now: moment.Moment) => {
        if (startTime.isSame(now, 'minute')) {
            return '(Now)';
        }
        const duration = moment.duration(startTime.diff(now));
        const hours = Math.round(duration.asHours());
        const minutes = duration.minutes();

        switch (hours) {
            case 0:
                switch (minutes) {
                    case 1:
                        return '(1 min)';
                    default:
                        return `(${minutes} mins)`;
                }
            case 1:
                return `(1 hour)`;
            default:
                return `(${hours} hours)`;
        }
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
                const now = moment().startOf('minute');
                const updatedAppointment = {
                    ...appointment,
                    timeUntil: calculateTimeUntil(appointment.startTime, now),
                    colour: getAppointmentColour(appointment.appointmentType)
                };

                setAppointmentsMap(prevMap => ({
                    ...prevMap,
                    [appointment.id]: updatedAppointment
                }));
            }
        });
    }

    const showEditAppointmentModal = (appointmentId: string) => {
        const appointment = appointmentsMap[appointmentId];
        if (!appointment) return;

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

    const showViewAppointmentModal = (appointmentId: string) => {
        const appointment = appointmentsMap[appointmentId];
        if (!appointment) return;

        setExistingAppointment(appointment);
        setRightButtonAction(() => {
            return (app: any) => {
                showEditAppointmentModal(appointment.id);
            };
        });

        setModalTitle(' ');
        setReadonly(true);
        setRightButtonText('Edit');
        setShowAppointmentModal(true);
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

                setVisibleAppointmentIds(prevIds =>
                    prevIds.filter(id => id !== appointmentId)
                );

                setShowAppointmentModal(false);
            }
        });
    }

    const renderAppointment = (appointmentId: string) => {
        const appointment = appointmentsMap[appointmentId];
        if (!appointment) return null;

        return (
            <TouchableOpacity
                key={appointment.id}
                onPress={() => showViewAppointmentModal(appointment.id)}
            >
                <View style={styles.appointmentCard}>
                    <View style={styles.appointmentIconTime}>
                        <View style={[styles.initialsCircle, { backgroundColor: appointment.colour }]}></View>
                        <View style={styles.appointmentTime}>
                            <Text style={styles.timeText}>{appointment.startTime.format("HH:mm")}</Text>
                            <Text style={styles.timeText}>{appointment.timeUntil}</Text>
                        </View>
                    </View>
                    <View style={styles.appointmentDetails}>
                        <Text style={styles.appointmentType}>
                            {appointment.appointmentType}
                        </Text>
                        <Text style={styles.staffInfo}>{appointment.description}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (visibleAppointmentIds.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Todays schedule</Text>
                <View style={styles.noAppointments}>
                    <MaterialCommunityIcons name="clock-check-outline" size={60} color={theme.colours.textSecondary} />
                    <Text style={styles.noAppointmentsText}>That's all for today.</Text>
                </View>
            </View>
        );
    } else {
        return (
            <>
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
                    <Text style={styles.title}>Todays schedule</Text>

                    {visibleAppointmentIds.slice(0, 4).map(id => (
                        renderAppointment(id)
                    ))}
                </View>
            </>
        );
    }
};

const styles = StyleSheet.create({
    // Styles remain unchanged
    container: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
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
        width: 30,
        height: 30,
        borderRadius: 15,
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
        padding: 20,
    },
    noAppointmentsText: {
        marginTop: 10,
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
    },
});

export default TodaySchedule;
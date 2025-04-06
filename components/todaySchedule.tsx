import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';
import { getUserAppointments } from '@/services/profileService';
import { Timestamp } from 'firebase/firestore'
import moment from 'moment';
import { useAuth } from '@/context/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Appointment {
    id: string;
    description: string;
    startTime: moment.Moment;
    appointmentType: string;
    colour: string;
    timeUntil?: string;
    [key: string]: any; // Allow additional properties
}

const TodaySchedule = () => {
    const [appointments, setAppointments] = useState < Appointment[] > ([]);
    const appointmentRef = useRef < Appointment[] > ([]);
    const { user } = useAuth();
    const intervalRef = useRef < NodeJS.Timeout | null > (null);
    const firstSyncRef = useRef < NodeJS.Timeout | null > (null);

    useEffect(() => {
        getUserAppointments(user?.uid).then((appointmentDocs) => {
            const appointmentData: Appointment[] = [];
            appointmentDocs.forEach((doc) => {
                const data = doc.data();
                appointmentData.push({
                    ...data, // Include any additional fields
                    id: doc.id,
                    description: data.description || '',
                    startTime: timestampToMoment(data.startTime),
                    appointmentType: data.appointmentType || '',
                    colour: getAppointmentColour(data.appointmentType),
                });
            });
            setAppointments(appointmentData);
            filterFutureOnly(appointmentData);
            setMinuteSync();
        })

        return () => {
            if (firstSyncRef.current) clearTimeout(firstSyncRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    useEffect(() => {
        appointmentRef.current = appointments;
    }, [appointments]);

    const setMinuteSync = () => {
        const now = moment()
        const nextMinute = now.clone().add(1, 'minute').startOf('minute');
        const timeout = nextMinute.diff(now, 'milliseconds');

        if (firstSyncRef.current) clearTimeout(firstSyncRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        firstSyncRef.current = setTimeout(() => {
            filterFutureOnly(appointmentRef.current);

            intervalRef.current = setInterval(() => {
                filterFutureOnly(appointmentRef.current);
            }, 60000); // 1 minute interval
        }, timeout);
    }

    const filterFutureOnly = (appointments: Appointment[]) => {
        const now = moment().startOf('minute');

        const filteredAppointments = appointments
            .filter(appointment => appointment.startTime.isAfter(now) && appointment.startTime.isSame(now, 'day'))
            .map(appointment => {
                const timeUntil = calculateTimeUntil(appointment.startTime, now);
                return {
                    ...appointment,
                    timeUntil,
                };
            });
        setAppointments(filteredAppointments);
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

    const timestampToMoment = (timestamp: Timestamp) => {
        const jsDate = timestamp.toDate();
        return moment(jsDate);
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

    const renderAppointment = (appointment: Appointment) => {
        return (
            <View key={appointment.id} style={styles.appointmentCard}>
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
        );
    };

    if (appointments.length == 0) {
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
            <View style={styles.container}>
                <Text style={styles.title}>Todays schedule</Text>
    
                {appointments.slice(0,4).map(item => (
                    renderAppointment(item)
                ))}
            </View>
        );
    }
};

const styles = StyleSheet.create({
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
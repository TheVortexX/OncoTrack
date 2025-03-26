import React, { useState, useEffect, FC } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle, StatusBar, Platform } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';

interface Appointment {
    id: string;
    provider: string;
    startTime: string;
    endTime: string;
    appointmentType: string;
    staff: string;
    dateFormatted: string;
    userId: string;
    [key: string]: any; // Allow additional properties
}

const ScheduleScreen: FC = () => {
    const [selectedDate, setSelectedDate] = useState < Date > (new Date());
    const [appointments, setAppointments] = useState < Appointment[] > ([]);
    const { user } = useAuth();

    useEffect(() => {
        fetchAppointments(selectedDate);
    }, [selectedDate]);

    const fetchAppointments = async (date: Date): Promise<void> => {
        try {
            const formattedDate = date.toISOString().split('T')[0];

            // Query Firestore for appointments on the selected date
            // TODO sort firestore storage of appointments and add appointment functionality
            const appointmentsRef = collection(firestore, 'appointments');
            const q = query(
                appointmentsRef,
                where('userId', '==', user?.uid),
                where('dateFormatted', '==', formattedDate)
            );

            const querySnapshot = await getDocs(q);
            const appointmentData: Appointment[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                appointmentData.push({
                    id: doc.id,
                    provider: data.provider || '',
                    startTime: data.startTime || '',
                    endTime: data.endTime || '',
                    appointmentType: data.appointmentType || '',
                    staff: data.staff || '',
                    dateFormatted: data.dateFormatted || '',
                    userId: data.userId || '',
                    ...data // Include any additional fields
                });
            });

            setAppointments(appointmentData);
        } catch (error) {
            console.error("Error fetching appointments:", error);
        }
    };

    const renderAppointment = (appointment: Appointment) => {
        const initials = appointment.provider
            .split(' ')
            .map(name => name && name[0])
            .join('');

        return (
            <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentTime}>
                    <Text style={styles.timeText}>{`${appointment.startTime} - ${appointment.endTime}`}</Text>
                </View>

                <View style={styles.appointmentDetails}>
                    <Text style={styles.providerName}>{appointment.provider}</Text>
                    <Text style={styles.appointmentType}>{appointment.appointmentType}</Text>
                    <Text style={styles.staffInfo}>{appointment.staff}</Text>
                </View>

                <View style={[styles.initialsCircle, { backgroundColor: theme.colours.primary }]}>
                    <Text style={styles.initialsText}>{initials}</Text>
                </View>
            </View>
        );
    };

    const renderDayHeader = () => {
        const day = selectedDate.getDate();
        const dayName = selectedDate.toLocaleDateString('en-GB', { weekday: 'short' });

        return (
            <View style={styles.dayHeader}>
                <Text style={styles.dayNumber}>{day}</Text>
                <Text style={styles.dayName}>{dayName}</Text>
            </View>
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
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Schedule</Text>
                    <Text style={styles.subHeaderText}>Your weeks schedule</Text>
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
                    onDateSelected={(date: any) => setSelectedDate(date)}
                    selectedDate={selectedDate}
                    scrollable
                    highlightDateContainerStyle={{
                        backgroundColor: theme.colours.primary,
                        borderColor: theme.colours.calendar.selected,
                        borderRadius: 30,
                    }}
                    customDatesStyles={[
                        {

                            // Example of custom styling for specific dates (like appointment dates)
                            // TODO highlight dates with appointments
                            dates: [new Date()],
                            dateContainerStyle: {
                                borderWidth: 2,
                                borderColor: theme.colours.calendar?.appointment,
                                borderRadius: 20,
                            },
                        }
                    ]}
                />

                <ScrollView style={styles.appointmentsContainer}>
                    {renderDayHeader()}

                    {appointments.length > 0 ? (
                        appointments.map(appointment => renderAppointment(appointment))
                    ) : (
                        <View style={styles.noAppointments}>
                            <Ionicons name="calendar-outline" size={48} color={theme.colours.textSecondary} />
                            <Text style={styles.noAppointmentsText}>No appointments scheduled for this day</Text>
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
        padding: 15,
        shadowColor: theme.colours.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    appointmentTime: {
        marginRight: 15,
    },
    timeText: {
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
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
        marginLeft: 10,
    },
    initialsText: {
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.white,
        fontSize: 20,
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
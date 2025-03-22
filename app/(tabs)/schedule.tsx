import React, { useState, useEffect, FC } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

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

interface StylesType {
    container: ViewStyle;
    calendarStrip: ViewStyle;
    calendarHeader: TextStyle;
    dateNumber: TextStyle;
    dateName: TextStyle;
    highlightedDateNumber: TextStyle;
    highlightedDateName: TextStyle;
    disabledDateName: TextStyle;
    disabledDateNumber: TextStyle;
    appointmentsContainer: ViewStyle;
    dayHeader: ViewStyle;
    dayNumber: TextStyle;
    dayName: TextStyle;
    appointmentCard: ViewStyle;
    appointmentTime: ViewStyle;
    timeText: TextStyle;
    appointmentDetails: ViewStyle;
    providerName: TextStyle;
    appointmentType: TextStyle;
    staffInfo: TextStyle;
    initialsCircle: ViewStyle;
    initialsText: TextStyle;
    noAppointments: ViewStyle;
    noAppointmentsText: TextStyle;
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
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" translucent />
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create < StylesType > ({
    container: {
        flex: 1,
        backgroundColor: theme.colours.background,
    },
    calendarStrip: {
        height: 100,
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: theme.colours.blue99,
    },
    calendarHeader: {
        color: theme.colours.textPrimary,
        fontSize: 16,
    },
    dateNumber: {
        color: theme.colours.textPrimary,
        fontSize: 14,
    },
    dateName: {
        color: theme.colours.textSecondary,
        fontSize: 12,
    },
    highlightedDateNumber: {
        color: theme.colours.textOnPrimary,
        fontSize: 14,
    },
    highlightedDateName: {
        color: theme.colours.textOnPrimary,
        fontSize: 12,
    },
    disabledDateName: {
        color: theme.colours.lightGray,
        fontSize: 12,
    },
    disabledDateNumber: {
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
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
    },
    dayName: {
        fontSize: 16,
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
        fontSize: 14,
        color: theme.colours.textSecondary,
    },
    appointmentDetails: {
        flex: 1,
    },
    providerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colours.textPrimary,
        marginBottom: 4,
    },
    appointmentType: {
        fontSize: 14,
        color: theme.colours.textSecondary,
        marginBottom: 2,
    },
    staffInfo: {
        fontSize: 12,
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
        color: theme.colours.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    noAppointments: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    noAppointmentsText: {
        marginTop: 10,
        fontSize: 16,
        color: theme.colours.textSecondary,
    },
});

export default ScheduleScreen;
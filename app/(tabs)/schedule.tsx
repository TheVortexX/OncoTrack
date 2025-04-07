import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, TouchableOpacity } from 'react-native';
import CalendarStrip from 'react-native-calendar-strip';
import moment from 'moment';
import { Timestamp } from 'firebase/firestore';
import { FontAwesome6, Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getUserAppointments } from '@/services/profileService';
import Modal from '@/components/modal';
import AppointmentForm from '@/components/appointmentForm';

//TODO adding of appointments


interface Appointment {
    id: string;
    description: string;
    provider: string;
    startTime: moment.Moment;
    endTime: moment.Moment;
    appointmentType: string;
    staff: string;
    [key: string]: any; // Allow additional properties
}

const ScheduleScreen = () => {
    const [selectedDate, setSelectedDate] = useState < moment.Moment > (moment());
    const [appointments, setAppointments] = useState < Appointment[] > ([]);
    const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        getUserAppointments(user?.uid).then((appointmentDocs) => {
            const appointmentData: Appointment[] = [];
            appointmentDocs.forEach((doc) => {
                const data = doc.data();
                appointmentData.push({
                    ...data, // Include any additional fields
                    id: doc.id,
                    description: data.description || '',
                    provider: data.provider || '',
                    startTime: timestampToMoment(data.startTime),
                    endTime: timestampToMoment(data.endTime),
                    appointmentType: data.appointmentType || '',
                    staff: data.staff || '',
                    colour: getAppointmentColour(data.appointmentType),
                });
            });
            setAppointments(appointmentData);
        })
    }, []);

    
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
    
    const getUpcomingAppointments = useCallback(() => {
        if (appointments.length === 0) return [];
        const today = moment();
        return appointments.filter(appointment => appointment.startTime.isAfter(today, 'day'));
    }, [appointments])

    // TODO allow appointments that span over multiple days
    const dayAppointments = useCallback((appointments: Appointment[], date: moment.Moment) => {
        if (appointments.length === 0) return [];
        return appointments.filter(appointment => date.isSame(appointment.startTime, 'day'));
    }, [appointments, selectedDate]);

    const renderAppointment = (appointment: Appointment, future?: boolean) => {
        const initials = appointment.provider
            .split(' ')
            .map(name => name && name[0])
            .join('')
            .slice(0, 4);

        const size = initials.length > 3 ? 16 : 20;

        return (
            <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentIconTime}>
                    <View style={[styles.initialsCircle, { backgroundColor: appointment.colour }]}>
                        <Text style={[styles.initialsText, { fontSize: size } ]}>{initials}</Text>
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
        dayAppointments(appointments, date).forEach(appointment => {
            dotsForDate.dots.push({
                color: appointment.colour,
                selectedColor: appointment.colour == theme.colours.primary ? theme.colours.blue99 : appointment.colour,
            });
        });
        return dotsForDate;
    }

    const addNewAppointment = () => {
        setShowNewAppointmentModal(true);
    }
    
    const saveNewAppointment = (appointment: Appointment) => {
        console.log("Would save appointment", appointment);
    }

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
            <Modal
                visible={showNewAppointmentModal}
                onClose={() => setShowNewAppointmentModal(false)}
                leftButtonText="Cancel"
                rightButtonText="Add"
                onLeftButtonPress={() => setShowNewAppointmentModal(false)}
                onRightButtonPress={() => addNewAppointment()}
                backgroundColor={theme.colours.background}            
                title='New'
            >
                <AppointmentForm 
                    onSave={saveNewAppointment}
                />
            </Modal>
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
                        onPress={addNewAppointment}
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
                    {dayAppointments(appointments, selectedDate).length > 0 ? (
                        dayAppointments(appointments, selectedDate).map(appointment => renderAppointment(appointment))
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
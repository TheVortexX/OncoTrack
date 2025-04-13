import * as Notifications from 'expo-notifications';
import { doc, getDoc } from '@firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { Platform } from 'react-native';
import moment from 'moment';
import { theme } from '@/constants/theme';

const db = firestore;

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
    [key: string]: any;
}

interface AppointmentsMap {
    [id: string]: Appointment;
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Request permissions
export async function requestLocalNotificationPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('appointments', {
            name: 'Appointments',
            importance: Notifications.AndroidImportance.MAX,
            lightColor: theme.colours.red,
            sound: 'notification.wav'
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    return finalStatus === 'granted';
}

// Schedule notification for an appointment
export async function scheduleAppointmentNotification(
    appointment: Appointment,
    userId?: string,
    reminderTime?: moment.Duration,
): Promise<string | null> {
    let reminderMinutes = 0;
    let notificationsEnabled = true;

    if (reminderTime) {
        reminderMinutes = reminderTime.asMinutes();
    } 
    if (userId) {
        try {
            const userSettingsRef = doc(db, 'users', userId, 'settings', 'notifications');
            const docSnap = await getDoc(userSettingsRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                reminderMinutes += data.reminderTime || 60;
                notificationsEnabled = data.enabled !== undefined ? data.enabled : true;
            }
        } catch (error) {
            console.error('Error getting notification settings:', error);
        }
    }

    if (reminderMinutes == 0) reminderMinutes = 60; // Default to 60 minutes if no reminder time is set

    if (!notificationsEnabled) {
        console.log('Notifications are disabled for this user');
        return null;
    }

    // notification time based on user preferences
    const notificationTime = moment(appointment.startTime).subtract(reminderMinutes, 'minutes').toDate();

    // Cancel existing notifications for this appointment
    if (appointment.notificationId) {
        await Notifications.cancelScheduledNotificationAsync(appointment.notificationId);
    }

    // if the appointment is in the past
    if (moment(notificationTime).isBefore(moment())) {
        return null;
    }

    const formattedTime = moment(appointment.startTime).format('h:mm A');
    const formattedDate = moment(appointment.startTime).format('ddd, MMM Do');

    // Schedule the notification
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `Upcoming: ${appointment.appointmentType}`,
                body: `${appointment.provider}${appointment.staff ? ` with ${appointment.staff}` : ''} at ${formattedTime} on ${formattedDate}`,
                data: { appointmentId: appointment.id },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notificationTime,
            },
        });

        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
}

export async function scheduleAllAppointmentNotifications(
    appointments: AppointmentsMap,
    userId?: string
): Promise<AppointmentsMap> {
    const updatedAppointments: AppointmentsMap = {};

    for (const id in appointments) {
        const appointment = appointments[id];

        // Only schedule for future appointments
        if (moment(appointment.startTime).isAfter(moment())) {
            const notificationId = await scheduleAppointmentNotification(appointment, userId);

            if (notificationId) {
                updatedAppointments[id] = {
                    ...appointment,
                    notificationId
                };
            } else {
                updatedAppointments[id] = appointment;
            }
        } else {
            updatedAppointments[id] = appointment;
        }
    }

    return updatedAppointments;
}

// Cancel a notification for an appointment
export async function cancelAppointmentNotification(appointment: Appointment): Promise<boolean> {
    if (appointment.notificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(appointment.notificationId);
            return true;
        } catch (error) {
            console.error('Error cancelling notification:', error);
            return false;
        }
    }
    return false;
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

// DEBUG Get scheduled notifications
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
}

// Check if a notification is scheduled
export async function isNotificationScheduled(notificationId: string): Promise<boolean> {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return scheduledNotifications.some(notification => notification.identifier === notificationId);
}
import * as Notifications from 'expo-notifications';
import { doc, getDoc } from '@firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { Platform } from 'react-native';
import moment from 'moment';
import { theme } from '@/constants/theme';
import { medicationDueOnDate } from '@/utils/dateUtils';

const db = firestore;

// MEDICATIONS NOTIFICATIONS
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
    notificationIds?: Record<string, string>; // Map of timeOfDay to notification ID
    [key: string]: any;
}

interface MedicationsMap {
    [id: string]: Medication;
}

// Schedule notification for a single medication
export async function scheduleMedicationNotification(
    medication: Medication,
    timeOfDay: string,
    userId?: string,
    medicationTimes?: string[]
): Promise<[string, number] | null> {
    if (!medicationTimes || medicationTimes.length < 3) {
        medicationTimes = ['08:00', '12:00', '18:00'];
    }

    const timeMap: Record<string, string> = {
        'morning': medicationTimes[0],
        'afternoon': medicationTimes[1],
        'evening': medicationTimes[2]
    };

    const selectedTime = timeMap[timeOfDay];
    if (!selectedTime) return null;

    const [hour, minute] = selectedTime.split(':').map(Number);

    let notificationTime = moment().set({ hour, minute, second: 0, millisecond: 0 });

    // If time today has already passed, schedule for tomorrow
    if (notificationTime.isBefore(moment())) {
        notificationTime.add(1, 'day');
    }

    const startDate = medication.startDate;
    let endDate = medication.endDate || moment().add(1, 'year');
    const frequency = medication.frequency;

    // Increment the notification time until it falls within the medication schedule
    while (!medicationDueOnDate(startDate, endDate, frequency, notificationTime) && notificationTime.isBefore(endDate)) {
        notificationTime.add(1, 'day');
    }

    // Cancel existing notification if there is one
    if (medication.notificationIds && medication.notificationIds[timeOfDay]) {
        await Notifications.cancelScheduledNotificationAsync(
            medication.notificationIds[timeOfDay]
        );
    }

    // Get notification settings from user preferences
    let notificationsEnabled = true;

    if (userId) {
        try {
            const userSettingsRef = doc(db, 'users', userId, 'settings', 'notifications');
            const docSnap = await getDoc(userSettingsRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                notificationsEnabled = data.enabled !== undefined ? data.enabled : true;
            }
        } catch (error) {
            console.error('Error getting notification settings:', error);
        }
    }

    if (!notificationsEnabled) {
        console.log('Notifications are disabled for this user');
        return null;
    }

    // Schedule the notification
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `Medication: ${medication.name}`,
                body: `Time to take ${medication.dosage} ${medication.units}`,
                data: {
                    medicationId: medication.id,
                    timeOfDay: timeOfDay
                },
                sound: 'notification.wav',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notificationTime.toDate(),
            },
        });
        return [notificationId, 0];
    } catch (error) {
        console.error('Error scheduling medication notification:', error);
        return null;
    }
}

// Schedule notifications for all medications
export async function scheduleAllMedicationNotifications(
    medications: MedicationsMap,
    userId?: string,
    medicationTimes?: string[]
): Promise<MedicationsMap> {
    const updatedMedications: MedicationsMap = {};

    for (const id in medications) {
        const medication = medications[id];
        updatedMedications[id] = { ...medication };

        if (!updatedMedications[id].notificationIds) {
            updatedMedications[id].notificationIds = {};
        }

        // For each time of day the medication should be taken
        for (const timeOfDay of medication.timeOfDay) {
            const result = await scheduleMedicationNotification(
                medication,
                timeOfDay,
                userId,
                medicationTimes
            );

            if (result) {
                const [notificationId, _] = result;
                updatedMedications[id].notificationIds[timeOfDay] = notificationId;
            }
        }
    }

    return updatedMedications;
}

// Cancel all notifications for a medication
export async function cancelMedicationNotifications(medication: Medication): Promise<boolean> {
    if (!medication.notificationIds) {
        return true;
    }

    let success = true;
    for (const timeOfDay in medication.notificationIds) {
        try {
            await Notifications.cancelScheduledNotificationAsync(
                medication.notificationIds[timeOfDay]
            );
        } catch (error) {
            console.error('Error canceling notification:', error);
            success = false;
        }
    }

    return success;
}

export async function scheduleMedicationNotifications(
    medication: Medication,
    userId?: string,
    medicationTimes?: string[]
): Promise<Medication> {
    const updatedMedication = { ...medication };
    if (!updatedMedication.notificationIds) {
        updatedMedication.notificationIds = {};
    }

    // For each time of day the medication should be taken
    for (const timeOfDay of medication.timeOfDay) {
        const result = await scheduleMedicationNotification(
            medication,
            timeOfDay,
            userId,
            medicationTimes
        );

        if (result) {
            const [notificationId, _] = result;
            updatedMedication.notificationIds[timeOfDay] = notificationId;
        }
    }

    return updatedMedication;
}

//  APPOINTMENTS NOTIFICATIONS
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
): Promise<[string, number] | null> {
    let reminderMinutes = 0;
    let notificationsEnabled = true;

    if (appointment.travelTime) {
        reminderMinutes += appointment.travelTime.asMinutes() || 0;
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
                sound: 'notification.wav',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: notificationTime,
            },
        });
        return [notificationId, reminderMinutes];
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
            const result = await scheduleAppointmentNotification(appointment, userId);
            if (result) {
                const [notificationId, reminderTime] = result;
                updatedAppointments[id] = {
                    ...appointment,
                    notificationId,
                    reminderTime
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
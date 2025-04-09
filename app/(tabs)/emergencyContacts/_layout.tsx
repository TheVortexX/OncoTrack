import { EmergencyContactsProvider } from '@/context/emergencyContacts';
import { Stack } from 'expo-router';

export default function EmergencyContactsLayout() {
    return (
        <EmergencyContactsProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right', // This enables the sliding animation
                }}
            />
        </EmergencyContactsProvider>
    );
}
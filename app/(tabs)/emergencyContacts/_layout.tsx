import { EmergencyContactsProvider } from '@/context/emergencyContacts';
import { Slot } from 'expo-router';


export default function EmergencyContactsLayout() {
    return (
        <EmergencyContactsProvider>
            <Slot/>
        </EmergencyContactsProvider>
    );
}
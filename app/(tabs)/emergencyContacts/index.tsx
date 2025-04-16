import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Alert, Platform, StatusBar, Linking } from 'react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEmergencyContacts } from '@/context/emergencyContacts';
import Header from '@/components/header';

type EmergencyContact = {
    id: string;
    name: string;
    number: string;
    description: string;
    style?: any;
};

const { width } = Dimensions.get('window');

export default function EmergencyContactsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const { contacts, deleteContact } = useEmergencyContacts();

    const handleCall = async (number: string) => {
        const formattedNum = number.replace(/\s/g, '');
        const phoneUrl = `tel:${formattedNum}`;

        try {
            return await Linking.openURL(phoneUrl);
        } catch (err) {
            console.error(err);
            Alert.alert(
                'Phone Call Not Supported',
                'Your device does not support making phone calls',
                [{ text: 'OK' }]
            );
        }
    };

    const handleDelete = (contactId: string, contactName: string) => {
        // prevent deletion of emergency services contact
        if (contactId === 'emergency-services') return;

        Alert.alert(
            'Delete Contact',
            `Are you sure you want to delete ${contactName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteContact(contactId);
                    }
                }
            ]
        );
    };

    const renderContactItem = ({ item }: { item: EmergencyContact }) => (
        <View style={styles.contactWrapper}>
            {/* only show delete button for non-emergency services contacts */}
            {item.id !== 'emergency-services' && (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id, item.name)}
                >
                    <Ionicons name="close-circle-outline" size={30} color={theme.colours.error || '#ff3b30'} />
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={[styles.contactCard, item.style?.contactCard]}
                onPress={() => handleCall(item.number)}
            >
                <View style={styles.contactContent}>
                    <Text style={[styles.contactName, item.style?.name]}>{item.name}</Text>
                    <Text style={styles.contactNumber}>{item.number}</Text>
                    <Text style={styles.contactDescription}>{item.description}</Text>
                </View>
                <View style={styles.callIconContainer}>
                    <Ionicons name="call" size={24} color={theme.colours.primary} />
                </View>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Header 
                title='Emergency Contacts'
                subtitle='Tap a contact to call'
                leftButtonType='close'
                colour={theme.colours.primary}
            />

            <FlatList
                data={contacts}
                renderItem={renderContactItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
            />

            {user && (
                <TouchableOpacity
                    style={[
                        styles.addButton,
                        Platform.OS === 'ios' ? { marginBottom: 30 } : { marginBottom: 20 }
                    ]}
                    onPress={() => { router.push('/emergencyContacts/new') }}
                >
                    <Ionicons name="add-circle" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add Contact</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
        marginBottom: 70,
        paddingBottom: 20,
    },
    listContainer: {
        padding: 16,
    },
    contactWrapper: {
        position: 'relative',
        marginBottom: 12,
    },
    contactCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    contactContent: {
        flex: 1,
    },
    contactName: {
        fontSize: 18,
        fontFamily: theme.fonts.ubuntu.bold,
        marginBottom: 4,
    },
    contactNumber: {
        fontSize: 14,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.blue20,
        marginBottom: 8,
    },
    contactDescription: {
        fontSize: 14,
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.blue0,
    },
    callIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colours.gray99,
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    deleteButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 34,
        height: 34,
        zIndex: 10,
        backgroundColor: theme.colours.white,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        backgroundColor: theme.colours.buttonBlue,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        alignSelf: 'center',
        paddingBottom: 10,
        paddingTop: 10,
        borderRadius: 30,
        marginBottom: 20,
        width: width * 0.9,
    },
    addButtonText: {
        color: theme.colours.white,
        fontFamily: theme.fonts.openSans.semiBold,
        fontSize: 30,
        marginLeft: 8,
    },
});
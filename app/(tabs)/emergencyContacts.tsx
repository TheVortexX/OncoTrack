import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Linking, SafeAreaView, Alert } from 'react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';

type EmergencyContact = {
    id: string;
    name: string;
    number: string;
    description: string;
    style?: any;
};

export default function EmergencyContactsScreen() {
    const { user, getProfile } = useAuth();
    const [contacts, setContacts] = useState<EmergencyContact[]>([
        {
            id: 'emergency-services',
            name: 'Emergency Services',
            number: '999',
            description: 'Ambulance, Police, Fire',
            style: {
                contactCard: {
                    backgroundColor: theme.colours.primaryLight25,
                },
                name: {
                    color: theme.colours.primary,
                },
            }
        },
        {
            id: 'user-contact-1',
            name: 'Mum',
            number: '+4478512132923',
            description: 'Mum\'s mobile'
        },
        {
            id: 'user-contact-2',
            name: 'Dad',
            number: '+44754124124124',
            description: 'Dad\'s mobile'
        }
    ]);

    useEffect(() => {
        // TODO Fetch emergency contacts even when not authenticated
    }, []);

    const handleCall = (number: string) => {
        // TODO MAKE PHONE CALL
        Alert.alert(
            'Phone Call Not Supported',
            'Your device does not support making phone calls',
            [{ text: 'OK' }]
        );
    };

    const renderContactItem = ({ item }: { item: EmergencyContact }) => (
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
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Emergency Contacts</Text>
                <Text style={styles.subHeaderText}>Tap a contact to call</Text>
            </View>

            <FlatList
                data={contacts}
                renderItem={renderContactItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
            />

            {user && (
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {/* TODO Navigate to add contact screen */ }}
                >
                    <Ionicons name="add-circle" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add Contact</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6f7f7',
    },
    header: {
        backgroundColor: theme.colours.primary,
        padding: 16,
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
    listContainer: {
        padding: 16,
    },
    contactCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
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
        backgroundColor: '#f0f8f8',
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    addButton: {
        backgroundColor: theme.colours.blue20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 30,
        margin: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    addButtonText: {
        color: 'white',
        fontFamily: theme.fonts.ubuntu.regular,
        fontSize: 16,
        marginLeft: 8,
    },
});
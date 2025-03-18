import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions, Alert, Platform, StatusBar } from 'react-native';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type EmergencyContact = {
    id: string;
    name: string;
    number: string;
    description: string;
    style?: any;
};

const { width } = Dimensions.get('window');

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
        <>
            <View style={{
                backgroundColor: theme.colours.primary,
                height: Platform.OS === 'ios' ? 50 : 0
            }}>
                <StatusBar
                    backgroundColor={theme.colours.primary}
                    barStyle="light-content"
                />
            </View>

            <View style={styles.container}>
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
                        style={[
                            styles.addButton,
                            Platform.OS === 'ios' ? { marginBottom: 30 } : { marginBottom: 20 }
                        ]}
                        onPress={() => {/* TODO Navigate to add contact screen */ }}
                    >
                        <Ionicons name="add-circle" size={24} color="white" />
                        <Text style={styles.addButtonText}>Add Contact</Text>
                    </TouchableOpacity>
                )}
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#e6f7f7',
        marginBottom: 70,
        paddingBottom: 20,
    },
    header: {
        backgroundColor: theme.colours.primary,
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
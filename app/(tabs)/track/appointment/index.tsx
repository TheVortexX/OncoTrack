import React from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import Header from '@/components/header';

const TrackAppSelScreen = () => {
    const router = useRouter();
    return (
        <>
            <View style={styles.container}>
                <Header 
                    title='Track Appointment'
                    subtitle='Scan or manually enter appointment'
                    leftButtonType='back'
                />
                {/* Main Content */}
                <View style={styles.content}>
                    {/* Scan Card */}
                    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/track/appointment/captureAppointment')}>
                        <View style={styles.iconContainer}>
                            {/* Combined Icon */}
                            <View style={styles.combinedIconContainer}>
                                <Ionicons name="document-text-outline" size={40} color="black" style={styles.documentIcon} />
                                <View style={styles.scanLineContainer}>
                                    <Ionicons name="scan-outline" size={60} color="black" style={styles.scanIcon} />
                                </View>
                            </View>
                        </View>
                        <Text style={styles.cardTitle}>
                            <Text style={styles.boldText}>Scan</Text> your appointment letter
                        </Text>
                    </TouchableOpacity>

                    {/* Manual Card */}
                    <TouchableOpacity style={styles.card} onPress={() => router.replace('/schedule?openNewAppointment=true')}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="create-outline" size={60} color="black" />
                        </View>
                        <Text style={styles.cardTitle}>
                            <Text style={styles.boldText}>Manually</Text> add your appointment
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 80,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 50,
        width: 170,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 10,
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    combinedIconContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        height: 70,
    },
    documentIcon: {
        position: 'absolute',
        zIndex: 1,
    },
    scanLineContainer: {
        position: 'absolute',
        zIndex: 2,
    },
    scanIcon: {
        opacity: 0.8,
    },
    cardTitle: {
        textAlign: 'center',
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.blue0,
    },
    boldText: {
        fontFamily: theme.fonts.ubuntu.bold,
        fontSize: normaliseSize(16),
    }
});

export default TrackAppSelScreen;
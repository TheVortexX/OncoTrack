import React from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import Header from '@/components/header';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TrackScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <>
            <View style={[styles.container, {marginBottom: insets.bottom+50}]}>
                <Header
                    title='Track'
                    subtitle='Add a symptom, appointment or medication'
                />
                {/* Main Content */}
                <View style={styles.content}>
                    {/* Symptoms Card */}
                    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/track/symptomTrack')}>
                        <View style={styles.iconContainer}>
                            <Image source={require('@/assets/images/personSymptoms.png')} style={{ width: normaliseSize(60), height: normaliseSize(60) }} />
                        </View>
                        <Text style={styles.cardTitle} allowFontScaling={false}>
                            <Text style={styles.boldText}>Record</Text> your symptoms
                        </Text>
                    </TouchableOpacity>

                    {/* Medication Card */}
                    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/track/medication')}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="medkit-outline" size={60} color="black" />
                        </View>
                        <Text style={styles.cardTitle} allowFontScaling={false}>
                            <Text style={styles.boldText}>Track</Text> your medications
                        </Text>
                    </TouchableOpacity>

                    {/* Appointment Card */}
                    <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/track/appointment')}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar-number-outline" size={60} color="black" />
                        </View>
                        <Text style={styles.cardTitle} allowFontScaling={false}>
                            <Text style={styles.boldText}>Enter</Text> or <Text style={styles.boldText}>Scan</Text> an appointment
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
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: normaliseSize(50),
        width: normaliseSize(170),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 10,
        width: normaliseSize(70),
        height: normaliseSize(70),
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
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

export default TrackScreen;
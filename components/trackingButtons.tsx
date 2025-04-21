import React, { useState, useCallback } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5, FontAwesome6, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { useRouter, useFocusEffect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/services/firebaseConfig';
import { useAuth } from '@/context/auth';

// TODO finish these pages

interface TrackingCardProps {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    style?: any;
}

interface QuickTrackSettings {
    symptoms: {
        mood: boolean;
        pain: boolean;
        energy: boolean;
        digestive: boolean;
        skin: boolean;
        mind: boolean;
        temperature: boolean;
    };
}

const TrackingCard = ({ icon, title, onPress, style }: TrackingCardProps) => (
    <TouchableOpacity style={[styles.card, style?.card]} onPress={onPress}>
        <View style={[styles.iconContainer, style?.iconContainer]}>
            {icon}
        </View>
        <Text style={[styles.cardText, style?.cardText]} allowFontScaling={false}>{title}</Text>
    </TouchableOpacity>
);

const TrackingOptionsScroll = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [settings, setSettings] = useState<QuickTrackSettings | null>(null);

    const symptomCards = [
        {
            id: 'mood',
            title: 'Record your mood',
            icon: <FontAwesome5 name="smile" size={60} color="#000" />,
            route: '/track/quick/mood'
        },
        {
            id: 'pain',
            title: 'Record your pain',
            icon: <Ionicons name="bandage-outline" size={60} color="#000" />,
            route: '/track/quick/pain'
        },
        {
            id: 'energy',
            title: 'Record your energy',
            icon: <MaterialIcons name="bolt" size={60} color="#000" />,
            route: '/track/quick/energy'
        },
        {
            id: 'digestive',
            title: 'Record digestive issues',
            icon: <MaterialCommunityIcons name="stomach" size={60} color="#000" />,
            route: '/track/quick/digestive'
        },
        {
            id: 'skin',
            title: 'Record skin issues',
            icon: <Ionicons name="body-outline" size={60} color="#000" />,
            route: '/track/quick/skin'
        },
        {
            id: 'mind',
            title: 'Record mental state',
            icon: <MaterialCommunityIcons name="head-heart-outline" size={60} color="#000" />,
            route: '/track/quick/mind'
        },
        {
            id: 'temperature',
            title: 'Record your temperature',
            icon: <FontAwesome5 name="thermometer-half" size={60} color="#000" />,
            route: '/track/quick/temperature'
        }
    ];

    useFocusEffect(
        useCallback(() => {
            const fetchSettings = async () => {
                if (!user?.uid) return;

                setIsLoading(true);
                try {
                    const settingsDoc = await getDoc(doc(firestore, 'users', user.uid, 'settings', 'quickTrack'));

                    if (settingsDoc.exists()) {
                        setSettings(settingsDoc.data() as QuickTrackSettings);
                    } else {
                        setSettings({
                            symptoms: {
                                mood: true,
                                pain: false,
                                energy: false,
                                digestive: false,
                                skin: false,
                                mind: false,
                                temperature: true
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error fetching quick track settings:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchSettings();
        }, [user])
    );

    const getEnabledSymptomCards = () => {
        if (!settings) return [];

        return symptomCards.filter(card =>
            settings.symptoms[card.id as keyof typeof settings.symptoms]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Track your well-being</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TrackingCard
                    icon={<Image source={require('@/assets/images/personSymptoms.png')} style={{ width: 60, height: 60 }} />}
                    title="Record your symptoms"
                    onPress={() => router.replace('/track/symptomTrack?today=true')}
                />

                {/* Display enabled symptom cards */}
                {!isLoading && getEnabledSymptomCards().map((card, index) => (
                    <TrackingCard
                        key={`symptom-${card.id}-${index}`}
                        icon={card.icon}
                        title={card.title}
                        onPress={() => router.navigate(card.route as any)}
                    />
                ))}

                {/* Always show the settings card */}
                <TrackingCard
                    icon={<FontAwesome5 name="edit" size={60} color="#000" />}
                    title="Select what you want to record"
                    onPress={() => router.push('/accountSettings/quickTrack')}
                    style={{ card: { backgroundColor: theme.colours.gray90 }, iconContainer: { marginLeft: 10 } }}
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: normaliseSize(18),
        fontFamily: theme.fonts.openSans.bold,
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    scrollContent: {
        paddingLeft: 15,
        paddingRight: 5,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginRight: 20,
        marginBottom: 10,
        width: 150,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    iconContainer: {
        marginBottom: 10,
    },
    cardText: {
        textAlign: 'center',
        fontFamily: theme.fonts.openSans.regular,
        fontSize: normaliseSize(16),
    }
});

export default TrackingOptionsScroll;
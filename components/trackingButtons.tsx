import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface TrackingCardProps {
    icon: React.ReactNode;
    title: string;
    onPress: () => void;
    style?: any;
}

const TrackingCard = ({ icon, title, onPress, style}: TrackingCardProps) => (
    <TouchableOpacity style={[styles.card, style?.card]} onPress={onPress}>
        <View style={[styles.iconContainer, style?.iconContainer]}>
            {icon}
        </View>
        <Text style={[styles.cardText, style?.cardText]}>{title}</Text>
    </TouchableOpacity>
);

const TrackingOptionsScroll = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>Track your well-being</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <TrackingCard
                    icon={<FontAwesome5 name="smile" size={60} color="#000" />}
                    title="Record your mood"
                    onPress={() => console.log('Mood pressed')}
                />
                <TrackingCard
                    icon={<FontAwesome5 name="thermometer-half" size={60} color="#000" />}
                    title="Record your temperature"
                    onPress={() => console.log('Temperature pressed')}
                />
                <TrackingCard
                    icon={<Image source={require('@/assets/images/personSymptoms.png')} style={{ width: 60, height: 60 }} />}
                    title="Record your symptoms"
                    onPress={() => console.log('Symptoms pressed')}
                />
                <TrackingCard
                    icon={<FontAwesome5 name="edit" size={60} color="#000" />}
                    title="Select what you want to record"
                    onPress={() => console.log('Edit records pressed')}
                    style={{ card: { backgroundColor: '#f0f0f0' }, iconContainer: { marginLeft: 10 } }}
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
        fontSize: 18,
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
        fontSize: 16,
    }
});

export default TrackingOptionsScroll;
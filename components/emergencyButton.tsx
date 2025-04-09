import React from 'react';
import { TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

const EmergencyButton = ({ onPress }: { onPress?: () => void }) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress || (() => router.push('/(tabs)/emergencyContacts'))}
            activeOpacity={0.7}
        >
            <Image
                source={require('@/assets/images/EmergencyButton.png')}
                style={styles.image}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 4 },
        shadowRadius: 3.84,
        elevation: 5,
        shadowOpacity: 0.5
    },
    image: {
        width: '100%',
        height: '100%',
    }
});

export default EmergencyButton;
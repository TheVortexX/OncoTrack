import React from 'react';
import { TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const EmergencyButton = ({ onPress }: { onPress?: () => void }) => {
    const router = useRouter();
    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress || (() => router.navigate('/(tabs)/emergencyContacts'))}
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
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3.84,
        elevation: 5,
    },
    image: {
        width: '100%',
        height: '100%',
    }
});

export default EmergencyButton;
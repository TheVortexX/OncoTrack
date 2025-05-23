import React, { useEffect, useState } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

const NavBar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const insets = useSafeAreaInsets();

    const isActive = (path: string) => pathname === path;

    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
            }
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    // If keyboard is visible on Android, don't show the navbar
    if (Platform.OS === 'android' && isKeyboardVisible) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={[
                styles.navContent,
                Platform.OS === 'ios'
                    ? { paddingBottom: insets.bottom-10, height: 50 + insets.bottom }
                    : { paddingBottom: 10, height: 70 + insets.bottom },
            ]}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        if (!isActive('/')) router.replace('/');
                    }}
                >
                    <Ionicons
                        name="home-outline"
                        size={30}
                    />
                    <Text style={styles.navText} allowFontScaling={false}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        router.replace('/schedule');
                    }}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={30}
                    />
                    <Text style={styles.navText} allowFontScaling={false}>Schedule</Text>
                </TouchableOpacity>
                <View style={[styles.trackCircle, {marginBottom: 25+insets.bottom}]}>
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => {
                            router.replace('/(tabs)/track')
                         }}
                    >
                        <Ionicons name="add" size={40} color="#000" />
                        <Text style={styles.navText}>Track</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        router.navigate('/chat');
                     }}
                >
                    <Ionicons
                        name="chatbox-ellipses-outline"
                        size={30}
                    />
                    <Text style={styles.navText} allowFontScaling={false}>Chat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        router.replace('/accountSettings')
                    }}
                >
                    <Ionicons
                        name="person-outline"
                        size={30}
                    />
                    <Text style={styles.navText} allowFontScaling={false}>Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
    },
    navContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        backgroundColor: theme.colours.primaryLight75,
        paddingVertical: 10,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navText: {
        fontSize: normaliseSize(15),
        color: '#000',
    },
    trackCircle: {
        backgroundColor: theme.colours.primaryLight75,
        borderRadius: 30,
        width: 60,
        height: 60,
    },
    trackButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
});

export default NavBar;
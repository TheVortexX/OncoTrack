import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MMKV } from '@/utils/staticStorage';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/auth';

const NavBar = () => {
    const router = useRouter();
    const pathname = usePathname();

    const { signOut } = useAuth();

    const isActive = (path: string) => pathname === path;

    const accountPress = () => {
        Alert.alert('Reset defaults?', 'Reset variables to defaults', [
            { text: 'Yes', onPress: () => { debug_resetStorage() }, isPreferred: true },
            { text: 'Cancel', onPress: debug_signOutPrompt },
        ]);
    }

    const debug_signOutPrompt = () => {
        Alert.alert('Sign out?', 'Are you sure you want to sign out?', [
            { text: 'Yes', onPress: () => { debug_signOut() }, isPreferred: true },
            { text: 'No', onPress: () => {  } }, //navigate to account page
        ]);
    };

    const debug_signOut = () => {
        signOut();
    };

    const debug_resetStorage = () => {
        MMKV.clearAll();
        SecureStore.deleteItemAsync('auth_email');
        SecureStore.deleteItemAsync('auth_password');
        signOut();
    };

    return (
        <View style={styles.container}>
            <View style={styles.navContent}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => router.navigate('/')}
                >
                    <Ionicons
                        name="home-outline"
                        size={30}
                    />
                    <Text style={styles.navText}>Home</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {}}
                >
                    <Ionicons
                        name="calendar-outline"
                        size={30}
                    />
                    <Text style={styles.navText}>Schedule</Text>
                </TouchableOpacity>
                <View style={styles.trackCircle}>
                    <TouchableOpacity
                        style={styles.trackButton}
                        onPress={() => { }}
                    >
                        <Ionicons name="add" size={40} color="#000" />
                        <Text style={styles.navText}>Track</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => { }}
                >
                    <Ionicons
                        name="document-text-outline"
                        size={30}
                    />
                    <Text style={styles.navText}>Reports</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={accountPress}
                >
                    <Ionicons
                        name="person-outline"
                        size={30}
                    />
                    <Text style={styles.navText}>Account</Text>
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
        backgroundColor: '#F47A60',
        height: 70,
        paddingVertical: 10,
    },
    navItem: {
        alignItems: 'center',
        flex: 1,
    },
    navText: {
        fontSize: 15,
        color: '#000',
    },
    trackCircle: {
        backgroundColor: '#F47A60',
        borderRadius: 30,
        width: 60,
        height: 60,
        bottom: 30,
    },
    trackButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
});

export default NavBar;
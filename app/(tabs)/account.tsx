import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Switch, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/auth';
import { SafeAreaView } from 'react-native-safe-area-context';

const AccountScreen = () => {
    // TODO get actual profile information
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(true);
    const [isFaceIDSupported, setIsFaceIDSupported] = useState(true);
    const [displayName, setDisplayName] = useState('Not set');
    const [email, setEmail] = useState('Not set');


    const handleEditDisplayName = () => {
        router.push('/');
    };

    const debug_signOutPrompt = () => {
        Alert.alert('Sign out?', 'Are you sure you want to sign out?', [
            { text: 'Yes', onPress: () => { debug_signOut() }, isPreferred: true },
            { text: 'No', onPress: () => { } },
        ]);
    };

    const debug_signOut = () => {
        signOut();
    };

    const debug_resetStorage = () => {
        AsyncStorage.clear()
        SecureStore.deleteItemAsync('auth_email');
        SecureStore.deleteItemAsync('auth_password');
        signOut();
    };

    const resetDefaults = () => {
        Alert.alert('Reset defaults?', 'Reset variables to defaults', [
            { text: 'Yes', onPress: () => { debug_resetStorage() }, isPreferred: true },
            { text: 'Cancel' },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Account Settings</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile Information</Text>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Name</Text>
                            <Text style={styles.settingValue}>{displayName}</Text>
                        </View>
                        <TouchableOpacity onPress={handleEditDisplayName} style={styles.actionButton}>
                            <Text style={styles.actionButtonText}>Edit</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.settingRow}>
                        <View style={styles.settingInfo}>
                            <Text style={styles.settingLabel}>Email</Text>
                            <Text style={styles.settingValue}>{email}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security</Text>

                    <TouchableOpacity onPress={()=>{}} style={styles.menuItem}>
                        <View style={styles.menuItemContent}>
                            <Ionicons name="lock-closed-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                            <Text style={styles.menuItemText}>Reset Password</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colours.blue0} />
                    </TouchableOpacity>

                    {isFaceIDSupported && (
                        <View style={styles.menuItem}>
                            <View style={styles.menuItemContent}>
                                <Ionicons
                                    name={Platform.OS === 'ios' ? "id-card-outline" : "finger-print"}
                                    size={24}
                                    color={theme.colours.primary}
                                    style={styles.menuItemIcon}
                                />
                                <Text style={styles.menuItemText}>
                                    {Platform.OS === 'ios' ? 'Use Face ID' : 'Use Biometric Authentication'}
                                </Text>
                            </View>
                            <Switch
                                value={isFaceIDEnabled}
                                onValueChange={() => {}}
                                trackColor={{ false: theme.colours.blue80, true: theme.colours.primary }}
                                thumbColor={isFaceIDEnabled ? theme.colours.primary : theme.colours.gray}
                            />
                        </View>
                    )}
                </View>
                {/* APP SECTION */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App</Text>

                    <TouchableOpacity onPress={debug_signOutPrompt} style={styles.menuItem}>
                        <View style={styles.menuItemContent}>
                            <Ionicons name="exit-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                            <Text style={[styles.menuItemText, { color: theme.colours.primary }]}>Sign Out</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={theme.colours.blue0} />
                    </TouchableOpacity>

                    {/* DEBUG */}
                    <View style={styles.debugSection}>
                        <Text style={styles.debugTitle}>Debug Options</Text>

                        <TouchableOpacity onPress={resetDefaults} style={styles.menuItem}>
                            <View style={styles.menuItemContent}>
                                <Ionicons name="refresh-circle-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                <Text style={[styles.menuItemText, { color: theme.colours.primary }]}>Reset App Defaults</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colours.blue0} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>OncoTrack v1.0.0</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.gray50,
        marginBottom: 70,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.lightGray,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.colours.blue0,
    },
    section: {
        marginVertical: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.lightGray,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
    },
    settingValue: {
        fontSize: 14,
        marginTop: 4,
    },
    actionButton: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderColor: theme.colours.primary,
        borderWidth: 1,
    },
    actionButtonText: {
        fontSize: 14,
        color: theme.colours.primary,
        fontWeight: '500',
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.lightGray,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemIcon: {
        marginRight: 12,
    },
    menuItemText: {
        fontSize: 16,
    },
    debugSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: theme.colours.lightGray,
    },
    debugTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 12,
    },
    footer: {
        padding: 16,
        alignItems: 'center',
    },
    versionText: {
        fontSize: 14,
        color: theme.colours.gray,
    },
});

export default AccountScreen;
import React, { useCallback, useEffect, useState } from 'react';
import { normaliseSize } from '@/utils/normaliseSize';
import { View, Text, StyleSheet, Alert, ScrollView, Switch, TouchableOpacity, Platform, StatusBar, KeyboardAvoidingView } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/auth';
import Header from '@/components/header';
import useBiometrics from '@/hooks/useBiometrics';
import InputField from '@/components/InputField';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from '@/services/profileService';

const AccountScreen = () => {
    const router = useRouter();
    const { user, getProfile, signOut } = useAuth();
    const { isBiometricsAvailable } = useBiometrics();
    const [isFaceIDEnabled, setIsFaceIDEnabled] = useState(true);
    const [displayName, setDisplayName] = useState('Not set');
    const [editDisplay, setEditDisplay] = useState(false);
    const [email, setEmail] = useState(user?.email || 'Not set');

    useFocusEffect(
        useCallback(() => {
            const loadProfile = async () => {
                const profile = await getProfile();
                if (profile) {
                    setDisplayName(profile.fName + ' ' + profile.lName);
                    setEmail(profile.email);
                }
            };
            loadProfile();
            SecureStore.getItemAsync('auth_password').then((val) => {
                setIsFaceIDEnabled(val !== null);
            });
        }, [])
    );

    const handleEditDisplayName = () => {
        setEditDisplay(!editDisplay);
    };

    const handleSaveDisplayName = () => {
        if (!user) return;
        setEditDisplay(false);
        const fName = displayName.split(' ')[0];
        const lName = displayName.split(' ').slice(1).join(' ');
        updateUserProfile(user.uid, {
            fName,
            lName,
        }).then(() => {
            Alert.alert('Success', 'Name updated successfully!');
        })
    }

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
        <>
            <View style={styles.container}>
                <Header
                    title="Account Settings"
                    subtitle='Manage your profile and preferences'
                />
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        style={styles.scrollContent}
                        contentContainerStyle={styles.scrollContentContainer}
                        keyboardShouldPersistTaps="handled"  // This is important
                    >
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Profile Information</Text>

                            {editDisplay ? (
                                <View style={styles.settingRow}>
                                    <View style={styles.inputSaveContainer}>
                                        <View style={styles.inputContainer}>
                                            <InputField
                                                value={displayName}
                                                onChangeText={setDisplayName}
                                                placeholder={'Enter your First and Last name'}
                                                autoCapitalize="words"
                                                autoComplete='name'
                                                label='Name'
                                                style={{
                                                    input: [styles.changeSettingValue, styles.changeSettingValueContainer],
                                                    label: styles.settingLabel,
                                                }}
                                            />
                                        </View>
                                        <TouchableOpacity
                                            onPress={handleSaveDisplayName}
                                            style={styles.saveButton}
                                        >
                                            <Text style={styles.actionButtonText}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.settingRow}>
                                    <View style={styles.settingInfo}>
                                        <Text style={styles.settingLabel}>Name</Text>
                                        <Text style={styles.settingValue}>{displayName}</Text>
                                    </View>
                                    <TouchableOpacity onPress={handleEditDisplayName} style={styles.actionButton}>
                                        <Text style={styles.actionButtonText}>Edit</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <View style={styles.settingRow}>
                                <View style={styles.settingInfo}>
                                    <Text style={styles.settingLabel}>Email</Text>
                                    <Text style={styles.settingValue}>{email}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Security</Text>

                            <TouchableOpacity onPress={() => { }} style={styles.menuItem}>
                                <View style={styles.menuItemContent}>
                                    <Ionicons name="lock-closed-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>Reset Password</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colours.blue20} />
                            </TouchableOpacity>

                            {isBiometricsAvailable && (
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
                                        
                                        onValueChange={(toggle) => {
                                            setIsFaceIDEnabled(toggle)
                                            if (toggle) {
                                                SecureStore.setItemAsync('auth_useBiometrics', 'true');
                                                Alert.alert('Biometric Authentication', 'You will need to login with your password once to enable biometric authentication.');
                                            } else {
                                                SecureStore.deleteItemAsync('auth_useBiometrics');
                                            }
                                        }}
                                        trackColor={{ false: theme.colours.lightGray, true: theme.colours.primaryLight50 }}
                                        thumbColor={isFaceIDEnabled ? theme.colours.primary : theme.colours.gray90}
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Settings</Text>

                            <TouchableOpacity onPress={() => router.push('/accountSettings/medication')} style={styles.menuItem}>
                                <View style={styles.menuItemContent}>
                                    <Ionicons name="medical-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>Medication</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colours.blue20} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/accountSettings/notifications')} style={styles.menuItem}>
                                <View style={styles.menuItemContent}>
                                    <Ionicons name="notifications-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>Notification</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colours.blue20} />
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => router.push('/accountSettings/quickTrack')} style={styles.menuItem}>
                                <View style={styles.menuItemContent}>
                                    <MaterialIcons name="bolt" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>Quick Track</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colours.blue20} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>App</Text>

                            <TouchableOpacity onPress={debug_signOutPrompt} style={styles.menuItem}>
                                <View style={styles.menuItemContent}>
                                    <Ionicons name="exit-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                    <Text style={styles.menuItemText}>Sign Out</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={theme.colours.blue20} />
                            </TouchableOpacity>

                            <View style={styles.debugSection}>
                                <Text style={styles.debugTitle}>Debug Options</Text>

                                <TouchableOpacity onPress={resetDefaults} style={styles.menuItem}>
                                    <View style={styles.menuItemContent}>
                                        <Ionicons name="refresh-circle-outline" size={24} color={theme.colours.primary} style={styles.menuItemIcon} />
                                        <Text style={styles.menuItemText}>Reset App Defaults</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.colours.blue20} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.versionText}>OncoTrack v1.0.0</Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colours.blue99,
        marginBottom: 70,
        paddingBottom: 20,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 100,
    },
    section: {
        marginVertical: 12,
        marginHorizontal: 16,
        backgroundColor: theme.colours.surface,
        borderRadius: 12,
        shadowColor: theme.colours.blue0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: normaliseSize(18),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.blue20,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    settingInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    settingLabel: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    settingValue: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
        marginTop: 4,
    },
    inputSaveContainer: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 4,
    },
    inputContainer: {
        width: '80%',
    },
    changeSettingValueContainer: {
        padding: 5,
        borderRadius: 8,
        borderColor: theme.colours.border,
        borderWidth: 1,
        height: 50,
    },
    saveButton: {
        width: '15%',
        marginLeft: '5%',
        height: 35,
        borderRadius: 20,
        backgroundColor: theme.colours.primary,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginTop: 20,
    },
    changeSettingValue: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textSecondary,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: theme.colours.primary,
    },
    actionButtonText: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.white,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.divider,
    },
    menuItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemIcon: {
        marginRight: 12,
    },
    menuItemText: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.textPrimary,
    },
    debugSection: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: theme.colours.divider,
    },
    debugTitle: {
        fontSize: normaliseSize(16),
        fontFamily: theme.fonts.ubuntu.bold,
        color: theme.colours.gray,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    versionText: {
        fontSize: normaliseSize(14),
        fontFamily: theme.fonts.ubuntu.regular,
        color: theme.colours.gray,
    },
});

export default AccountScreen;
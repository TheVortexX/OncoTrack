import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, FirebaseAuthTypes} from '@react-native-firebase/auth';
import { setStoredValue, getStoredValue } from '@/utils/staticStorage';
import { Alert } from 'react-native';
import { getUserProfile, updateUserProfile } from '@/services/profileService';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type AuthContextType = {
    user: FirebaseAuthTypes.User | null;
    loading: boolean;
    signInUser: (email: string, password: string) => Promise<boolean>;
    createUser: (email: string, password: string) => Promise<FirebaseAuthTypes.User | null>;
    getProfile: () => Promise<FirebaseFirestoreTypes.DocumentData | null | undefined>;
    updateProfile: (updates: any) => Promise<boolean>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const auth = getAuth();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<FirebaseAuthTypes.User | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    const publicRoutes = ['/_sitemap'];

    useEffect(() => {
        if (loading) return;

        const inAuthFlow = segments[0] === '(auth)';
        const currentRoute = `/${segments.join('/')}`;
        console.log('currentRoute: ', currentRoute);

        const checkUserAndRoute = async () => {
            // Not authenticated and not in auth flow or public route
            if (!user && !inAuthFlow && !publicRoutes.includes(currentRoute)) {
                router.replace('/(auth)');
                return;
            }
            // User is authenticated
            if (user) {
                try {
                    const profile = await getProfile();

                    if (profile && profile.registrationStage === "name") {
                        router.replace('/(auth)/registerDetails');
                    } else if (inAuthFlow) {
                        // Only redirect to tabs if user is fully registered
                        router.replace('/(tabs)');
                    }
                } catch (error) {
                    console.error("Error checking user profile:", error);
                }
            }
        };

        checkUserAndRoute();
    }, [loading, user, segments]);

    const enableBiometrics = (password: string) => {
        setStoredValue('auth_biometricsEnrolled', true);
        setStoredValue('auth_biometricsEnrollmentAsked', true);
        SecureStore.setItemAsync('auth_password', password)
    }

    const signOut = async () => {
        await SecureStore.deleteItemAsync('auth_userToken');
        await SecureStore.deleteItemAsync('auth_password');
        setUserState(null);
    };

    const signInUser = async (email: string, password: string) => {

        setLoading(true);
        try {
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const user = credential.user
            
            setStoredValue('auth_hasLoggedInBefore', true);
            SecureStore.setItemAsync('auth_email', email);

            setUserState(user);


            return true;
        } catch (error) {
            console.error('Error signing in user: ', error);
            return false;
        } finally {
            setLoading(false);
        }
    }

    const createUser = async (email: string, password: string) => {
        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setUserState(userCredential.user);
            setStoredValue('auth_hasLoggedInBefore', true);
            SecureStore.setItemAsync('auth_email', email);
            
            const biometricsEnrollmentAsked = getStoredValue('auth_biometricsEnrollmentAsked', false);
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const usable = await LocalAuthentication.isEnrolledAsync();

            if (compatible && usable && !biometricsEnrollmentAsked) {
                Alert.alert('Use biometrics?', 'Would you like to use biometrics to log in?', [
                    { text: 'Enable', onPress: () => { enableBiometrics(password) }, isPreferred: true },
                    { text: 'Cancel', onPress: () => { setStoredValue('auth_biometricsEnrollmentAsked', true) } },
                ]);
            }
            return userCredential.user;
        } catch (error) {
            const authError = error as FirebaseAuthTypes.NativeFirebaseAuthError;
            console.error('Error creating user: ', error);
            let errorMessage = '';
            const match = authError.message.match(/\]\s*(.*)/);
            if (match && match[1]) {
                errorMessage = match[1];
            } else {
                errorMessage = authError.message;
            }
            Alert.alert('Registration failed', errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }

    const getProfile = async () => {
        setLoading(true);
        if (!userProfile) {
            try {
                if (user) {
                    const profile = await getUserProfile(user.uid);
                    if (profile) {
                        setUserProfile(profile);
                        return profile;
                    } else {
                        console.error('User profile not found');
                        return null;
                    }

                } else {
                    console.error('User not authenticated');
                    return null;
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                return null;
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
            return userProfile;
        }
    }

    const updateProfile = async (updates: any) => {
        setLoading(true);
        try {
            if (user) {
                await updateUserProfile(user.uid, updates);
                setUserProfile({ ...userProfile, ...updates });
                return true;
            } else {
                console.error('User not authenticated');
                return false;
            }
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signInUser, getProfile, updateProfile, signOut, createUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
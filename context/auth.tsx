import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { auth } from '@/services/firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User, AuthError} from 'firebase/auth';
import { DocumentData } from 'firebase/firestore';
import { setStoredValue, getStoredValue } from '@/hooks/useStorage';
import { Alert } from 'react-native';
import { getUserProfile, updateUserProfile } from '@/services/profileService';

type AuthContextType = {
    user: User | null;
    loading: boolean;
    signInUser: (email: string, password: string) => Promise<boolean>;
    createUser: (email: string, password: string) => Promise<User | null>;
    getProfile: () => Promise<DocumentData | null | undefined>;
    updateProfile: (updates: any) => Promise<boolean>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    const publicRoutes = ['/_sitemap'];

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUserState(firebaseUser);
        });

        // Cleanup subscription
        return unsubscribe;
    }, []);

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
            const user = credential.user;
            
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
        } catch (error: any) {
            console.error('Error creating user: ', error);
            let errorMessage = error.message || 'Registration failed';

            // Clean up the Firebase error message
            if (errorMessage.includes('Firebase:')) {
                errorMessage = errorMessage.split('Firebase:')[1].trim();
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
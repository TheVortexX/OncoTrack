import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, FirebaseAuthTypes} from '@react-native-firebase/auth';
import { Alert } from 'react-native';
import { setStoredValue, getStoredValue } from '@/utils/staticStorage';

type AuthContextType = {
    user: { user: FirebaseAuthTypes.User } | null;
    loading: boolean;
    setUser: (user: FirebaseAuthTypes.User) => Promise<void>;
    signInUser: (email: string, password: string) => Promise<boolean>;
    createUser: (email: string, password: string) => Promise<FirebaseAuthTypes.User | null>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const auth = getAuth();

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUserState] = useState<{ user: FirebaseAuthTypes.User } | null>(null);
    const [loading, setLoading] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    const publicRoutes = ['/_sitemap'];

    useEffect(() => {
        if (loading) return;
        const inAuthFlow = segments[0] === '(auth)';
        const currentRoute = `/${segments.join('/')}`;
        console.log('currentRoute: ', currentRoute); // DEBUG
        if (!user && !inAuthFlow && !publicRoutes.includes(currentRoute)) { // User is not authenticated and not in the auth flow or public route
            router.replace('/(auth)');
        } else if (user && inAuthFlow) { // User is authenticated and in the auth flow
            router.replace('/(tabs)');
        }
    }, [loading, user, segments]);

    const enableBiometrics = (password: string) => {
        setStoredValue('auth_biometricsEnrolled', true);
        setStoredValue('auth_biometricsEnrollmentAsked', true);
        SecureStore.setItemAsync('auth_password', password)
    }

    const setUser = async (user:FirebaseAuthTypes.User) => {
        await SecureStore.setItemAsync('auth_userToken', JSON.stringify(user));
        setUserState({ user });
    };

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

            SecureStore.setItemAsync('auth_email', email);
            await setUser(user);

            setStoredValue('auth_hasLoggedInBefore', true);

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
            setUser(userCredential.user);
            
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
            return null;
            Alert.alert('Registration failed', errorMessage);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, setUser, signInUser, signOut, createUser }}>
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
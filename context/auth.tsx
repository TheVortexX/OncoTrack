import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useStorage as getStorageValue, setValue as setStorageValue } from '@/hooks/useStorage';
import * as LocalAuthentication from 'expo-local-authentication';
import { getAuth, setPersistence, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { Alert } from 'react-native';

type AuthContextType = {
    user: { token: string} | null;
    loading: boolean;
    setToken: (token: string) => Promise<void>;
    authenticateToken: (token: string) => Promise<boolean>;
    signInUser: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ token: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const segments = useSegments();
    const router = useRouter();

    const publicRoutes = ['/_sitemap'];

    useEffect(() => {
        if (loading) return;
        const inAuthFlow = segments[0] === '(auth)';
        const currentRoute = `/${segments.join('/')}`;
        console.log('currentRoute: ', currentRoute);

        if (!user && !inAuthFlow && !publicRoutes.includes(currentRoute)) { // User is not authenticated and not in the auth flow or public route
            router.replace('/(auth)');
        } else if (user && inAuthFlow) { // User is authenticated and in the auth flow
            router.replace('/(tabs)');
        }
    }, [loading, user, segments]);

    const setToken = async (token: string) => {
        await SecureStore.setItemAsync('auth_userToken', token);
        setUser({ token });
    };

    const authenticateToken = async (token: string) => {
        setLoading(true);
        try {
            const response = await fetch('https://api.example.com/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (response.ok) {
                setUser({ token });
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error('Error authenticating token: ', error);
            return false;
        }
    }

    const signOut = async () => {
        await SecureStore.deleteItemAsync('userToken');
        setUser(null);
    };

    const signInUser = async (email: string, password: string) => {
        const enableBiometrics = (password: string) => {
            setStorageValue('auth_biometricsEnrolled', true);
            setStorageValue('auth_biometricsEnrollmentAsked', true);
            SecureStore.setItemAsync('auth_password', password)
        }

        setLoading(true);
        try {
            const auth = getAuth();
            await setPersistence(auth, { type: 'SESSION' }); 
            const credential = await signInWithEmailAndPassword(auth, email, password);
            const token = await credential.user.getIdToken();

            SecureStore.setItemAsync('auth_email', email);
            await setToken(token);

            const [biometricsEnrollmentAsked] = getStorageValue('auth_biometricsEnrollmentAsked', false);
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const usable = await LocalAuthentication.isEnrolledAsync();

            if (compatible && usable && !biometricsEnrollmentAsked) {
                Alert.alert('Use biometrics?', 'Would you like to use biometrics to log in next time?', [
                    { text: 'Enable', onPress: () => { enableBiometrics(password)}, isPreferred: true },
                    { text: 'Cancel', onPress: () => { setStorageValue('auth_biometricsEnrollmentAsked', true)} },
                ]);
            }
            setLoading(false);
            return true
        } catch (error) {
            console.error('Error signing in user: ', error);
            setLoading(false);
            return false;
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, setToken, authenticateToken, signInUser, signOut }}>
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
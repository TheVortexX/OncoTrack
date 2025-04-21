import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/auth';
import { useRouter } from 'expo-router';

export default function useBiometrics() {
    const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { signInUser } = useAuth();
    const router = useRouter();


    useEffect(() => {
        const checkBiometricSupport = async () => {
            const passw = await SecureStore.getItemAsync('auth_pasword');
            if (!passw) {
                setIsLoading(true);
                const compatible = await LocalAuthentication.hasHardwareAsync();
                const usable = await LocalAuthentication.isEnrolledAsync();
                setIsBiometricsAvailable(compatible && usable);
                setIsLoading(false);
            }
        }
        checkBiometricSupport();
    }, []);

    const attemptBiometricLogin = async (selected:boolean = false) => {
        if (isBiometricsAvailable) {
            try {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Login to OncoTrack',
                    cancelLabel: 'Use password',
                });
                setIsLoading(true);
                if (result.success) {
                    const email = await SecureStore.getItemAsync('auth_email');
                    const passw = await SecureStore.getItemAsync('auth_password');
                    if (email && passw) {
                        await signInUser(email, passw);
                    }
                }
            } catch (error) {
                console.error('Error authenticating with biometrics: ', error);
            } finally {
                setIsLoading(false);
                if (selected) {
                    router.navigate('/(auth)/login');
                }
            }
        } else if (selected) {
            console.log('Biometrics not available');
            router.navigate('/(auth)/login');
        } else {
            console.log('Biometrics not ready');
        }
        return true;
    }
    return { isLoading, isBiometricsAvailable, attemptBiometricLogin}
}
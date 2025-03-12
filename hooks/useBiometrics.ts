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
            const passw = await SecureStore.getItemAsync('auth:pasword');
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
                    const email = await SecureStore.getItemAsync('auth:email');
                    const passw = await SecureStore.getItemAsync('auth:password');
                    if (email && passw) {
                        const authSuccess = await signInUser(email, passw);
                        if (authSuccess) {
                            router.replace('/(tabs)');
                        }
                    }
                }
            } catch (error) {
                console.error('Error authenticating with biometrics: ', error);
            } finally {
                setIsLoading(false);
                if (selected) {
                    router.push('/(auth)/login');
                }
            }
        } else if (selected) {
            console.log('Biometrics not available');
            router.push('/(auth)/login');
        } else {
            console.log('Biometrics not ready');
        }
        return true;
    }
    return { isLoading, isBiometricsAvailable, attemptBiometricLogin}
}